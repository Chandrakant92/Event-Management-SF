pipeline {
    agent any

    environment {
        SF_USERNAME = 'cgawali@yrconsultinginc.org'   // Salesforce username
        SF_CLIENT_ID = credentials('sf-client-id')   // Connected App Consumer Key stored in Jenkins
        SF_JWT_KEY = credentials('sf-private-key')       // Private key stored as Secret File in Jenkins
        SF_INSTANCE_URL = 'https://login.salesforce.com'
    }

    stages {
        stage('🔍 Check Environment') {
            steps {
                echo "🛠 Checking environment variables..."
                sh 'echo \"SF_USERNAME=$SF_USERNAME\"'
                sh 'echo \"SF_CLIENT_ID=$SF_CLIENT_ID\"'
                sh 'ls -la $SF_KEY_FILE || echo \"❌ Key file not found\"'
            }
        }

         stage('🔐 Authenticate with Salesforce') {
            steps {
                echo "🔑 Authenticating with Salesforce org..."
                sh '''
                sfdx auth:jwt:grant \
                  --client-id $SF_CLIENT_ID \
                  --jwt-key-file $SF_KEY_FILE \
                  --username $SF_USERNAME \
                  --instance-url $SF_INSTANCE \
                  --set-default-dev-hub || {
                      echo "❌ Authentication Failed"
                      exit 1
                  }
                '''
                echo "✅ Successfully authenticated to Salesforce org 🎉"
            }
        }

         stage('📦 Deploy Metadata') {
            steps {
                echo "🚀 Starting metadata deployment..."
                sh '''
                sfdx force:source:deploy \
                  --sourcepath force-app \
                  --targetusername $SF_USERNAME \
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
            echo "🎉 Pipeline completed successfully! 🚩"
        }
        failure {
            echo "💥 Pipeline failed — check above logs..🔝"
        }
    }
}
