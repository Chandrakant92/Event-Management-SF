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
                        if not exist "%SF_JWT_KEY_FILE%" (
                            echo ❌ Key file missing!
                            exit /b 1
                        )

                        echo 🚀 Authenticating...
                        sfdx auth:jwt:grant ^
                          --client-id "%SF_CLIENT_ID%" ^
                          --jwt-key-file "%SF_JWT_KEY_FILE%" ^
                          --username "%SF_USERNAME%" ^
                          --instance-url "%SF_INSTANCE_URL%" ^
                          --set-default-dev-hub

                        if errorlevel 1 exit /b 1
                    '''
                }
                echo "✅ Authenticated to Salesforce"
            }
        }

        stage('📊 SonarQube Analysis') {
            steps {
                echo "🔍 Running SonarQube Scan..."
                script {
                    def scannerHome = tool 'SonarScanner'

                    withSonarQubeEnv('SonarQubeLocalhost') {
                        bat """
                            "${scannerHome}\\bin\\sonar-scanner.bat" ^
                              -Dsonar.projectKey=EventManagement ^
                              -Dsonar.projectName="Event Management Salesforce" ^
                              -Dsonar.sources=force-app ^
                              -Dsonar.working.directory=sonar
                        """
                    }

                    echo "🔎 Print generated task file:"
                    bat 'type sonar\\report-task.txt'
                }
            }
        }

    stage('🚦 SonarQube Quality Gate') {
        steps {
        echo "⏳ Checking Quality Gate..."
        script {
            // Read properties
            def props = readProperties file: 'sonar/report-task.txt'
            def serverUrl = props.serverUrl
            def ceTaskUrl = props.ceTaskUrl
            def projectKey = props.projectKey

          
            // echo " Task URL: ${ceTaskUrl}"

            sleep(time: 60, unit: 'SECONDS')

            withCredentials([string(credentialsId: 'SonarScannerToken', variable: 'SONAR_TOKEN')]) {

              
                
                def ceStatus = bat(
                    script: """
                        @echo off
                        curl -s -u %SONAR_TOKEN%: "${ceTaskUrl}"
                    """,
                    returnStdout: true
                ).trim()

              
                // More lenient check - look for SUCCESS or FAILED
                if (ceStatus.contains('"status":"FAILED"')) {
                    error "❌ SonarQube analysis FAILED"
                }

                // if (ceStatus.contains('"status":"PENDING"') || ceStatus.contains('"status":"IN_PROGRESS"')) {
                //     echo "⚠️ Analysis still running, waiting longer..."
                //     sleep(time: 30, unit: 'SECONDS')
                    
                //     // Try again
                //     ceStatus = bat(
                //         script: """
                //             @echo off
                //             curl -s -u %SONAR_TOKEN%: "${ceTaskUrl}"
                //         """,
                //         returnStdout: true
                //     ).trim()
                    
                //     echo "📋 CE Task Response (2nd check):"
                //     echo ceStatus
                // }

                // If we got here and have SUCCESS, continue
                if (ceStatus.contains('"status":"SUCCESS"')) {
                    echo "✅ CE task completed successfully"
                } else {
                    echo "⚠️ WARNING: CE task status unclear, but proceeding to Quality Gate check..."
                }
                
                def qgUrl = "${serverUrl}/api/qualitygates/project_status?projectKey=${projectKey}"
                echo "API URL: ${qgUrl}"

                def qgStatus = bat(
                    script: """
                        @echo off
                        curl -s -u %SONAR_TOKEN%: "${qgUrl}"
                    """,
                    returnStdout: true
                ).trim()

                // echo "📊 Quality Gate Response:"
                // echo qgStatus

                // Check if we got a valid response
                if (!qgStatus || qgStatus.length() < 10) {
                    error "❌ No response from Quality Gate API"
                }

                if (qgStatus.contains('401') || qgStatus.contains('Unauthorized')) {
                    error "❌ Authentication failed for Quality Gate check"
                }

                // Check Quality Gate status
                if (qgStatus.contains('"status":"ERROR"')) {
                    echo "❌ QUALITY GATE FAILED!"
                    echo "🔗 View details: ${serverUrl}/dashboard?id=${projectKey}"
                    error "❌ PIPELINE STOPPED: Quality Gate Failed!"
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"


                } else if (qgStatus.contains('"status":"OK"')) {
                    echo "✅ QUALITY GATE PASSED! 🎉"
                    echo "✓ All quality checks passed"
                    echo "✓ Safe to deploy"
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

                } else if (qgStatus.contains('"status":"WARN"')) {
                    echo "⚠️ QUALITY GATE WARNING - but passing"
                    echo "🔗 Review: ${serverUrl}/dashboard?id=${projectKey}"

                } else {
                    echo "⚠️ WARNING: Could not parse Quality Gate status"
                    echo "Full response: ${qgStatus}"
                    error "Unable to determine Quality Gate status"
                }
            }
        }
        }
    }

        stage('📦 Deploy Metadata') {
            steps {
                echo "🚀 Deploying to Salesforce..."
                bat '''
                    sf project deploy start ^
                      --source-dir force-app ^
                      --target-org %SF_USERNAME% ^
                      --wait 10 ^
                      --verbose

                    if errorlevel 1 exit /b 1
                '''
                echo "✅ Deployment Complete"
            }
        }
    }

    post {
        success {
            echo "🎉 Pipeline completed successfully! 🚀"
        }
        failure {
            echo "💥 Pipeline failed — check above logs."
        }
        always {
            echo "🧹 Cleaning up workspace..."
            script {
                if (fileExists('sonar/report-task.txt')) {
                    echo "📊 SonarQube report available (sonar/report-task.txt)"
                }
            }
            cleanWs()
        }
    }
}
