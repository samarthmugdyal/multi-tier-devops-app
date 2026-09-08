pipeline {

    agent any

    options {
        timestamps()
        disableConcurrentBuilds()

        timeout(
            time: 30,
            unit: 'MINUTES'
        )

        buildDiscarder(
            logRotator(
                numToKeepStr: '10'
            )
        )
    }

    stages {

        /*
         * =========================================================
         * CHECKOUT
         * =========================================================
         */

        stage('Checkout') {
            steps {
                echo '========================================'
                echo 'Checking out source code from GitHub'
                echo '========================================'

                checkout scm
            }
        }


        /*
         * =========================================================
         * VALIDATE PROJECT
         * =========================================================
         */

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


        /*
         * =========================================================
         * DOCKER CHECK
         * =========================================================
         */

        stage('Docker Check') {
            steps {

                sh '''
                    set -e

                    echo "Docker version:"
                    docker --version

                    echo "Docker Compose version:"
                    docker compose version

                    echo "Docker is available."
                '''
            }
        }


        /*
         * =========================================================
         * BUILD DOCKER IMAGES
         * =========================================================
         */

        stage('Build Docker Images') {
            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'docker-hub-credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {

                    sh '''
                        set -e

                        echo "========================================"
                        echo "Building Docker Images"
                        echo "========================================"

                        echo "Docker Hub User: $DOCKER_USERNAME"

                        echo ""
                        echo "Building Backend image..."

                        docker build \
                            -t "$DOCKER_USERNAME/multi-tier-backend:$BUILD_NUMBER" \
                            -t "$DOCKER_USERNAME/multi-tier-backend:latest" \
                            ./backend


                        echo ""
                        echo "Building Frontend image..."

                        docker build \
                            -t "$DOCKER_USERNAME/multi-tier-frontend:$BUILD_NUMBER" \
                            -t "$DOCKER_USERNAME/multi-tier-frontend:latest" \
                            ./frontend


                        echo ""
                        echo "Building Proxy image..."

                        docker build \
                            -t "$DOCKER_USERNAME/multi-tier-proxy:$BUILD_NUMBER" \
                            -t "$DOCKER_USERNAME/multi-tier-proxy:latest" \
                            ./proxy


                        echo ""
                        echo "========================================"
                        echo "All Docker images built successfully."
                        echo "========================================"

                        echo ""
                        echo "Images created:"
                        docker images | grep "$DOCKER_USERNAME/multi-tier"
                    '''
                }
            }
        }


        /*
         * =========================================================
         * DOCKER HUB LOGIN
         * =========================================================
         */

        stage('Docker Hub Login') {
            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'docker-hub-credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {

                    sh '''
                        set +x

                        echo "Logging in to Docker Hub..."

                        echo "$DOCKER_PASSWORD" | docker login \
                            --username "$DOCKER_USERNAME" \
                            --password-stdin

                        echo "Docker Hub login successful."
                    '''
                }
            }
        }


        /*
         * =========================================================
         * PUSH DOCKER IMAGES
         * =========================================================
         */

        stage('Push Images') {
            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'docker-hub-credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {

                    sh '''
                        set -e

                        echo "========================================"
                        echo "Pushing Images to Docker Hub"
                        echo "========================================"


                        echo ""
                        echo "Pushing Backend image..."

                        docker push \
                            "$DOCKER_USERNAME/multi-tier-backend:$BUILD_NUMBER"

                        docker push \
                            "$DOCKER_USERNAME/multi-tier-backend:latest"


                        echo ""
                        echo "Pushing Frontend image..."

                        docker push \
                            "$DOCKER_USERNAME/multi-tier-frontend:$BUILD_NUMBER"

                        docker push \
                            "$DOCKER_USERNAME/multi-tier-frontend:latest"


                        echo ""
                        echo "Pushing Proxy image..."

                        docker push \
                            "$DOCKER_USERNAME/multi-tier-proxy:$BUILD_NUMBER"

                        docker push \
                            "$DOCKER_USERNAME/multi-tier-proxy:latest"


                        echo ""
                        echo "========================================"
                        echo "All images pushed successfully."
                        echo "========================================"
                    '''
                }
            }
        }


        /*
         * =========================================================
         * DEPLOY TO APPLICATION EC2
         * =========================================================
         */

        stage('Deploy to Application EC2') {
            steps {

                withCredentials([
                    string(
                        credentialsId: 'ssh-for-jen-docker',
                        variable: 'APP_SERVER_IP'
                    )
                ]) {

                    sshagent(
                        credentials: [
                            'ssh-for-jen-docker'
                        ]
                    ) {

                        sh '''
                            set -e

                            echo "========================================"
                            echo "Deploying Application"
                            echo "Build Number: $BUILD_NUMBER"
                            echo "Application Server: $APP_SERVER_IP"
                            echo "========================================"


                            echo ""
                            echo "Connecting to Application EC2..."


                            ssh \
                                -o StrictHostKeyChecking=no \
                                ubuntu@"$APP_SERVER_IP" \
                                "cd /home/ubuntu/multi-tier-devops-app && \
                                 sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=$BUILD_NUMBER/' .env && \
                                 docker compose pull && \
                                 docker compose up -d --remove-orphans"


                            echo ""
                            echo "========================================"
                            echo "Deployment completed successfully."
                            echo "========================================"
                        '''
                    }
                }
            }
        }


        /*
         * =========================================================
         * HEALTH CHECK
         * =========================================================
         */

        stage('Health Check') {
            steps {

                withCredentials([
                    string(
                        credentialsId: 'docker-server-ip',
                        variable: 'APP_SERVER_IP'
                    )
                ]) {

                    sshagent(
                        credentials: [
                            'ssh-for-jen-docker'
                        ]
                    ) {

                        sh '''
                            set -e

                            echo "Waiting for application to start..."

                            sleep 15


                            echo ""
                            echo "Checking application health..."


                            ssh \
                                -o StrictHostKeyChecking=no \
                                ubuntu@"$APP_SERVER_IP" \
                                "curl -fsS http://localhost/ > /dev/null"


                            echo ""
                            echo "========================================"
                            echo "APPLICATION IS HEALTHY"
                            echo "========================================"
                        '''
                    }
                }
            }
        }
    }


    /*
     * =============================================================
     * POST ACTIONS
     * =============================================================
     */

    post {

        success {

            echo '''
            ==========================================
            CI/CD PIPELINE SUCCESSFUL
            ==========================================

            GitHub
                ↓
            Jenkins
                ↓
            Docker Build
                ↓
            Docker Hub
                ↓
            Application EC2
                ↓
            Health Check

            ==========================================
            '''
        }


        failure {

            echo '''
            ==========================================
            CI/CD PIPELINE FAILED
            ==========================================

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