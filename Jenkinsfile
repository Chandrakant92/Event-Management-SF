pipeline {
    agent any
     
    environment {
        SF_USERNAME = 'cgawali@yrconsultinginc.org'
        SF_INSTANCE_URL = 'https://login.salesforce.com'
    }
    
    stages {
        stage('🔍 Check Environment') {
            steps {
                echo "🛠 Checking environment variables..."
                bat 'echo SF_USERNAME: %SF_USERNAME%'
                bat 'echo SF_INSTANCE_URL: %SF_INSTANCE_URL%'
                bat 'where sfdx || echo ❌ SFDX CLI not found in PATH'
            }
        }
        
        stage('🔐 Authenticate with Salesforce') {
            steps {
                echo "🔑 Authenticating with Salesforce org..."
                withCredentials([
                    string(credentialsId: 'sf-client-id', variable: 'SF_CLIENT_ID'),
                    file(credentialsId: 'sf-private-key', variable: 'SF_JWT_KEY_FILE')
                ]) {
                    bat '''
                        echo 🔍 Checking credentials...
                        if exist "%SF_JWT_KEY_FILE%" (
                            echo ✅ Key file found
                        ) else (
                            echo ❌ Key file not accessible
                            exit /b 1
                        )
                        
                        echo 🚀 Starting JWT authentication...
                        sfdx auth:jwt:grant ^
                          --client-id "%SF_CLIENT_ID%" ^
                          --jwt-key-file "%SF_JWT_KEY_FILE%" ^
                          --username "%SF_USERNAME%" ^
                          --instance-url "%SF_INSTANCE_URL%" ^
                          --set-default-dev-hub
                        
                        if errorlevel 1 (
                            echo ❌ Authentication Failed
                            exit /b 1
                        )
                    '''
                }
                echo "✅ Successfully authenticated to Salesforce org 🎉"
            }
        }
        stage('📊 SonarQube Analysis') {
            steps {
                echo "🔍 Running SonarQube Code Analysis."
           script {
            def scannerHome = tool 'SonarScanner' // Configure this in Jenkins Global Tools
            withSonarQubeEnv('SonarQubeLocalhost') { // Configure SonarQube server in Jenkins
                bat """
                    "${scannerHome}\\bin\\sonar-scanner.bat" ^
                      -Dsonar.projectKey=EventManagement ^
                      -Dsonar.projectName="Event Management Salesforce" ^
                      -Dsonar.sources=force-app ^
                      -Dsonar.working.directory=sonar 
                 """
                }
                echo "🔎 Checking generated task file..."
                bat 'type sonar\\report-task.txt'
            }
                echo "✅ Sonar Scanner Connected Successfully."

            }
        }
       
        stage('🚦 SonarQube Quality Gate') {
    steps {
        echo "⏳ Checking SonarQube Quality Gate via API..."
        script {
            // Read the report file to get project details
            def reportPath = 'sonar\\report-task.txt'
            def props = readProperties file: reportPath
            def serverUrl = props['serverUrl']
            def projectKey = props['projectKey']
            def ceTaskUrl = props['ceTaskUrl']
            
            echo "🔗 Server: ${serverUrl}"
            echo "📦 Project: ${projectKey}"
            echo "🔍 Task URL: ${ceTaskUrl}"
            
            // Wait for SonarQube to finish analysis
            echo "⏳ Waiting for analysis to complete..."
            sleep(time: 20, unit: 'SECONDS')
            
            // Check Quality Gate status using API
            withCredentials([string(credentialsId: 'SonarScannerToken', variable: 'SONAR_TOKEN')]) {
                
                // First verify the CE task completed
                def taskStatus = bat(
                    script: """
                        @echo off
                        curl -s -u %SONAR_TOKEN%: "${ceTaskUrl}"
                    """,
                    returnStdout: true
                ).trim()
                
                if (!taskStatus.contains('"status":"SUCCESS"')) {
                    error "❌ SonarQube analysis task failed or is still running"
                }
                
                echo "✅ Analysis task completed"
                
                // Now check Quality Gate
                def qgApiUrl = "${serverUrl}/api/qualitygates/project_status?projectKey=${projectKey}"
                echo "🔍 Checking Quality Gate: ${qgApiUrl}"
                
                def qgStatus = bat(
                    script: """
                        @echo off
                        curl -s -u %SONAR_TOKEN%: "${qgApiUrl}"
                    """,
                    returnStdout: true
                ).trim()
                
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "📊 Quality Gate Response:"
                echo "${qgStatus}"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                
                // Check the status
                if (qgStatus.contains('"status":"ERROR"')) {
                    echo "❌ QUALITY GATE FAILED!"
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    
                    // Extract failure details
                    if (qgStatus.contains('"metricKey":"new_violations"')) {
                        def matcher = (qgStatus =~ /"actualValue":"(\d+)"/)
                        if (matcher.find()) {
                            echo "❌ New Issues Found: ${matcher.group(1)}"
                            echo "   Required: 0 new issues"
                        }
                    }
                    
                    if (qgStatus.contains('"metricKey":"new_coverage"')) {
                        echo "⚠️  Code coverage check also evaluated"
                    }
                    
                    if (qgStatus.contains('"metricKey":"new_duplicated_lines_density"')) {
                        echo "⚠️  Code duplication check also evaluated"
                    }
                    
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    echo "🔗 View details: ${serverUrl}/dashboard?id=${projectKey}"
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    
                    error "❌ PIPELINE STOPPED: Quality Gate Failed! Fix the issues in SonarQube before deploying."
                    
                } else if (qgStatus.contains('"status":"OK"')) {
                    echo "✅ QUALITY GATE PASSED! 🎉"
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    echo "✓ No new code violations"
                    echo "✓ Code quality standards met"
                    echo "✓ Safe to deploy"
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    
                } else if (qgStatus.contains('"status":"WARN"')) {
                    echo "⚠️  QUALITY GATE WARNING"
                    echo "Some metrics are in warning state but within acceptable limits"
                    echo "🔗 Review: ${serverUrl}/dashboard?id=${projectKey}"
                    
                } else {
                    echo "⚠️  WARNING: Could not parse Quality Gate status"
                    echo "Response received but status unclear"
                    echo "🔗 Check manually: ${serverUrl}/dashboard?id=${projectKey}"
                    error "Unable to determine Quality Gate status - blocking deployment for safety"
                }
            }
        }
    }
}
        stage('📦 Deploy Metadata') {
            steps {
                echo "🚀 Starting metadata deployment..."
                bat '''
                     sf project deploy start ^
                      --source-dir force-app ^
                      --target-org %SF_USERNAME% ^
                      --wait 10 ^
                      --verbose

                    if errorlevel 1 (
                        echo ❌ Deployment failed!
                        exit /b 1
                    )
                '''
                echo "✅ Metadata deployment finished 🎉"
            }
        }
    }
    
    // Add here
}