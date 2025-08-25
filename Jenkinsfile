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
                echo "SF_USERNAME: ${SF_USERNAME}"
                echo "SF_INSTANCE_URL: ${SF_INSTANCE_URL}"
            }
        }
        
        stage('🔐 Authenticate with Salesforce') {
            steps {
                echo "🔑 Authenticating with Salesforce org..."
                withCredentials([
                    string(credentialsId: 'sf-client-id', variable: 'SF_CLIENT_ID'),
                    file(credentialsId: 'sf-private-key', variable: 'SF_JWT_KEY_FILE')
                ]) {
                    sh '''
                        echo "🔍 Checking credentials..."
                        echo "Client ID length: ${#SF_CLIENT_ID}"
                        ls -la "$SF_JWT_KEY_FILE" || echo "❌ Key file not accessible"
                        
                        echo "🚀 Starting JWT authentication..."
                        sfdx auth:jwt:grant \
                          --client-id "$SF_CLIENT_ID" \
                          --jwt-key-file "$SF_JWT_KEY_FILE" \
                          --username "$SF_USERNAME" \
                          --instance-url "$SF_INSTANCE_URL" \
                          --set-default-dev-hub || {
                              echo "❌ Authentication Failed"
                              exit 1
                          }
                    '''
                }
                echo "✅ Successfully authenticated to Salesforce org 🎉"
            }
        }
        
        stage('📦 Deploy Metadata') {
            steps {
                echo "🚀 Starting metadata deployment..."
                sh '''
                    sfdx force:source:deploy \
                      --sourcepath force-app \
                      --targetusername "$SF_USERNAME" \
                      --verbose || {
                          echo "❌ Deployment failed!"
                          exit 1
                      }
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