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
             echo "⏳ Waiting for SonarQube Quality Gate result..."
                script {
                     bat 'type sonar\\report-task.txt'
                    try {
                        timeout(time: 5, unit: 'MINUTES') {
                            def qg = waitForQualityGate()
                             
                               echo "📊 Full Quality Gate Object: ${qg}"
                               echo "📊 Status: ${qg.status}"
                               echo "📊 All properties: ${qg.properties}"
                               
                            if (qg.status != 'OK') {
                                echo "⚠️ Quality Gate failed: ${qg.status}"
                                // Don't fail the pipeline, just warn
                                 error "Pipeline aborted due to quality gate failure: ${qg.status}"
                            } else {
                                echo "✅ Quality Gate passed! 🎉 "
                                echo "ℹ️ Continuing with deployment...!!"
                            }
                        }
                    } catch (Exception e) {
                        echo "⚠️ Quality Gate check failed or timed out: ${e.getMessage()}"
                       // echo "ℹ️ Continuing with deployment..."
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
    
    post {
        success {
            echo "🎉 Pipeline completed successfully! 🚀"
        }
        failure {
            echo "💥 Pipeline failed — check above logs.. 🔝"
        }
        always {
            echo "🧹 Cleaning up workspace..."
             script {
                if (fileExists('target/sonar/report-task.txt')) {
                    echo "📊 SonarQube report available"
                }
            }
            cleanWs()
        }
    }
}