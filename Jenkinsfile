pipeline {
    agent any
    stages {
        stage("Fetch repo") {
            steps {
                checkout scm
                echo "Checking out repository"
            }
        }

        stage("Build docker container for client") {
            agent {
                dockerfile {
                    dir "client"
                }
            }

            steps {
               echo "Building docker image from dockerfile in client" 
            }
        }
    }
}
