pipeline {

    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')

        buildDiscarder(
            logRotator(
                numToKeepStr: '10'
            )
        )
    }

    environment {

        DOCKER_BACKEND_IMAGE  = "${DOCKER_USERNAME}/multi-tier-backend"
        DOCKER_FRONTEND_IMAGE = "${DOCKER_USERNAME}/multi-tier-frontend"
        DOCKER_PROXY_IMAGE    = "${DOCKER_USERNAME}/multi-tier-proxy"

        DOCKER_CREDENTIAL_ID = 'dockerhub-credentials'

        APP_SERVER_CREDENTIAL_ID = 'app-server-ssh'
        APP_SERVER_IP_CREDENTIAL_ID = 'app-server-ip'

        APP_DIR = '/home/ubuntu/multi-tier-devops-app'
    }

    stages {

        // ==========================================
        // 1. CHECKOUT
        // ==========================================

        stage('Checkout') {

            steps {

                echo 'Checking out source code from GitHub...'

                checkout scm
            }
        }


        // ==========================================
        // 2. VALIDATE PROJECT
        // ==========================================

        stage('Validate Project') {

            steps {

                echo 'Validating project structure...'

                sh '''
                    set -e

                    test -f docker-compose.yml
                    test -f backend/Dockerfile
                    test -f frontend/Dockerfile
                    test -f proxy/Dockerfile

                    echo "Project structure validation successful."
                '''
            }
        }


        // ==========================================
        // 3. CHECK DOCKER
        // ==========================================

        stage('Docker Check') {

            steps {

                sh '''
                    set -e

                    docker --version
                    docker compose version

                    echo "Docker is available."
                '''
            }
        }


        // ==========================================
        // 4. BUILD BACKEND
        // ==========================================

        stage('Build Backend') {

            steps {

                sh '''
                    set -e

                    docker build \
                      -t ${DOCKER_BACKEND_IMAGE}:${BUILD_NUMBER} \
                      -t ${DOCKER_BACKEND_IMAGE}:latest \
                      ./backend
                '''
            }
        }


        // ==========================================
        // 5. BUILD FRONTEND
        // ==========================================

        stage('Build Frontend') {

            steps {

                sh '''
                    set -e

                    docker build \
                      -t ${DOCKER_FRONTEND_IMAGE}:${BUILD_NUMBER} \
                      -t ${DOCKER_FRONTEND_IMAGE}:latest \
                      ./frontend
                '''
            }
        }


        // ==========================================
        // 6. BUILD PROXY
        // ==========================================

        stage('Build Proxy') {

            steps {

                sh '''
                    set -e

                    docker build \
                      -t ${DOCKER_PROXY_IMAGE}:${BUILD_NUMBER} \
                      -t ${DOCKER_PROXY_IMAGE}:latest \
                      ./proxy
                '''
            }
        }


        // ==========================================
        // 7. DOCKER HUB LOGIN
        // ==========================================

        stage('Docker Hub Login') {

            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: "${DOCKER_CREDENTIAL_ID}",
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {

                    sh '''
                        set +x

                        echo "$DOCKER_PASSWORD" | docker login \
                            -u "$DOCKER_USERNAME" \
                            --password-stdin
                    '''
                }
            }
        }


        // ==========================================
        // 8. PUSH IMAGES
        // ==========================================

        stage('Push Images') {

            steps {

                sh '''
                    set -e

                    docker push ${DOCKER_BACKEND_IMAGE}:${BUILD_NUMBER}
                    docker push ${DOCKER_BACKEND_IMAGE}:latest

                    docker push ${DOCKER_FRONTEND_IMAGE}:${BUILD_NUMBER}
                    docker push ${DOCKER_FRONTEND_IMAGE}:latest

                    docker push ${DOCKER_PROXY_IMAGE}:${BUILD_NUMBER}
                    docker push ${DOCKER_PROXY_IMAGE}:latest
                '''
            }
        }


        // ==========================================
        // 9. DEPLOY TO APPLICATION EC2
        // ==========================================

        stage('Deploy to Application EC2') {

            steps {

                withCredentials([
                    string(
                        credentialsId: "${APP_SERVER_IP_CREDENTIAL_ID}",
                        variable: 'APP_SERVER_IP'
                    )
                ]) {

                    sshagent([
                        "${APP_SERVER_CREDENTIAL_ID}"
                    ]) {

                        sh '''
                            set -e

                            echo "Deploying build ${BUILD_NUMBER}..."

                            ssh \
                              -o StrictHostKeyChecking=no \
                              ubuntu@"$APP_SERVER_IP" \
                              "
                                set -e

                                cd $APP_DIR

                                echo 'Updating deployment version...'

                                if grep -q '^IMAGE_TAG=' .env; then
                                    sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=${BUILD_NUMBER}/' .env
                                else
                                    echo 'IMAGE_TAG=${BUILD_NUMBER}' >> .env
                                fi

                                echo 'Pulling Docker images...'

                                docker compose pull

                                echo 'Starting application...'

                                docker compose up -d --remove-orphans

                                echo 'Current containers:'

                                docker compose ps
                              "
                        '''
                    }
                }
            }
        }


        // ==========================================
        // 10. HEALTH CHECK
        // ==========================================

        stage('Health Check') {

            steps {

                withCredentials([
                    string(
                        credentialsId: "${APP_SERVER_IP_CREDENTIAL_ID}",
                        variable: 'APP_SERVER_IP'
                    )
                ]) {

                    sshagent([
                        "${APP_SERVER_CREDENTIAL_ID}"
                    ]) {

                        sh '''
                            set -e

                            echo "Waiting for application..."

                            sleep 15

                            echo "Checking application..."

                            ssh \
                              -o StrictHostKeyChecking=no \
                              ubuntu@"$APP_SERVER_IP" \
                              "
                                curl -fsS http://localhost/ > /dev/null
                            "

                            echo "Application health check successful."
                        '''
                    }
                }
            }
        }
    }


    // ==========================================
    // POST ACTIONS
    // ==========================================

    post {

        success {

            echo '''
            ==========================================
            CI/CD PIPELINE SUCCESSFUL
            ==========================================
            '''
        }

        failure {

            echo '''
            ==========================================
            CI/CD PIPELINE FAILED
            Check the failed stage above.
            ==========================================
            '''
        }

        always {

            sh '''
                docker logout || true
                docker image prune -f || true
            '''
        }
    }
}