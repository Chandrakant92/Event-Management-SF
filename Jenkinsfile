pipeline {
    agent any

    environment {
        SF_USERNAME = 'cgawali@yrconsultinginc.org'   // Salesforce username
        SF_CLIENT_ID = credentials('SF_CLIENT_ID')   // Connected App Consumer Key stored in Jenkins
        SF_JWT_KEY = credentials('SF_JWT_KEY')       // Private key stored as Secret File in Jenkins
        SF_INSTANCE_URL = 'https://login.salesforce.com'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Authenticate') {
            steps {
                withCredentials([file(credentialsId: 'SF_JWT_KEY', variable: 'JWT_KEY_FILE')]) {
                    sh """
                    sfdx auth:jwt:grant \
                        --client-id $SF_CLIENT_ID \
                        --jwt-key-file $JWT_KEY_FILE \
                        --username $SF_USERNAME \
                        --instance-url $SF_INSTANCE_URL
                    """
                }
            }
        }

        stage('Deploy to Salesforce') {
            steps {
                sh 'sfdx force:source:deploy -p force-app/main/default'
            }
        }
    }
}
