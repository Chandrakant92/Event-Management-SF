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
                    def props = readProperties file: 'sonar/report-task.txt'
                    def serverUrl = props.serverUrl
                    def taskUrl = props.ceTaskUrl
                    def projectKey = props.projectKey

                    withCredentials([string(credentialsId: 'SonarScannerToken', variable: 'SONAR_TOKEN')]) {

                        // 1️⃣ Check CE task
                        def ce = bat(
                            script: "curl -s -u %SONAR_TOKEN%: ${taskUrl}",
                            returnStdout: true
                        ).trim()

                        if (!ce.contains('"status":"SUCCESS"')) {
                            error "❌ SonarQube analysis not finished or failed"
                        }

                        echo "✅ CE task success"

                        // 2️⃣ Check Quality Gate
                        def qgUrl = "${serverUrl}/api/qualitygates/project_status?projectKey=${projectKey}"

                        def qg = bat(
                            script: "curl -s -u %SONAR_TOKEN%: ${qgUrl}",
                            returnStdout: true
                        ).trim()

                        echo "📊 Quality Gate Response:"
                        echo qg

                        if (qg.contains('"status":"ERROR"')) {
                            error "❌ QUALITY GATE FAILED — BLOCKING PIPELINE"
                        }

                        if (qg.contains('"status":"OK"')) {
                            echo "✅ QUALITY GATE PASSED"
                        } else {
                            error "⚠️ Unknown QG status. Blocking pipeline for safety."
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
        success { echo "🎉 Pipeline Completed" }
        failure { echo "💥 Pipeline Failed" }
        always {
            echo "🧹 Cleaning workspace..."
            cleanWs()
        }
    }
}
