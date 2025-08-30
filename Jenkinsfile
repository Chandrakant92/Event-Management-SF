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
                echo "🔍 Running SonarQube Code Analysis..."
            withCredentials([string(credentialsId: 'SonarScannerToken', variable: 'SONAR_TOKEN')]) {
                bat '''
                sonar-scanner ^
                  -Dsonar.projectKey=EventManagement ^
                  -Dsonar.sources=force-app ^
                  -Dsonar.host.url=http://localhost:9000 ^
                  -Dsonar.token=%SONAR_TOKEN%
                '''
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
            cleanWs()
        }
    }
}