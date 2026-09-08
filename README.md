# Multi-Tier Docker Application — CI/CD & Monitoring

## 📌 Project Summary

A **4-tier containerized application** deployed using Docker and Docker Compose, integrated with **Jenkins for automated CI/CD** and **Prometheus + Grafana for monitoring and observability**.

### Application Tiers

- **Tier 1:** NGINX — Reverse Proxy
- **Tier 2:** Node.js — Frontend
- **Tier 3:** Python — Backend/API
- **Tier 4:** MySQL — Database

The complete application and DevOps stack can be hosted on an **AWS EC2** server.

---

## 🏗️ Project Architecture

![Project Architecture](C:\sam_workspacce\devOps-project\multi-tier-devops-app\images\multi-tier-devops_project-img.png)

### Project Flow

```text
Developer
    ↓ git push
GitHub
    ↓ Webhook
Jenkins
    ↓
Checkout → Build & Test → Build Docker Images
    ↓
Docker Compose Deployment
    ↓
NGINX → Node.js → Python → MySQL
    ↓
Prometheus → Grafana
    ↓
Metrics, Dashboards & Alerts
```

---

## 🔄 CI/CD Workflow

1. Developer pushes code to GitHub.
2. GitHub webhook automatically triggers Jenkins.
3. Jenkins checks out the latest source code.
4. Jenkins runs validation/tests.
5. Jenkins builds Docker images.
6. Jenkins deploys the application using Docker Compose.
7. Jenkins performs health checks.
8. Prometheus collects infrastructure/container/application metrics.
9. Grafana displays monitoring dashboards.

The objective is to make deployment **automated instead of manually rebuilding and restarting containers**.

---

## 📊 Monitoring & Observability

### Prometheus

Prometheus collects metrics from:

- Docker containers using **cAdvisor**
- Linux host using **Node Exporter**
- Application endpoints using Prometheus-compatible application metrics

### Grafana

Grafana connects to Prometheus and provides dashboards for:

- CPU and memory usage
- Disk and network usage
- Container performance
- Application/API metrics
- Service health

---

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| Frontend | Node.js |
| Backend | Python |
| Database | MySQL |
| Reverse Proxy | NGINX |
| Containerization | Docker |
| Orchestration | Docker Compose |
| Source Control | Git & GitHub |
| CI/CD | Jenkins |
| Monitoring | Prometheus |
| Visualization | Grafana |
| Container Metrics | cAdvisor |
| Host Metrics | Node Exporter |
| Cloud | AWS EC2 |

---

## 📁 Project Structure

```text
project/
├── frontend/
├── backend/
├── proxy/
├── database/
├── monitoring/
│   ├── prometheus/
│   └── grafana/
├── docker-compose.yml
├── Jenkinsfile
├── .gitignore
└── README.md
```

---

## 🚀 Main Components

### Docker Compose

Manages the application and monitoring services:

```text
NGINX | Node.js | Python | MySQL
Prometheus | Grafana | cAdvisor | Node Exporter
```

### Jenkins

Automates:

```text
GitHub → Build → Test → Docker Build → Deploy → Health Check
```

### Prometheus + Grafana

```text
Application / Host
        ↓
 Exporters / Metrics
        ↓
   Prometheus
        ↓
     Grafana
        ↓
 Dashboards & Alerts
```

---

## 🔐 Security Practices

- Store passwords and secrets using environment variables/Jenkins Credentials.
- Do not commit `.env` files or credentials to GitHub.
- Keep MySQL inaccessible from the public Internet.
- Restrict Jenkins, Prometheus and Grafana using firewall/security-group rules.
- Use persistent Docker volumes for database and monitoring data.

---

## 🎯 Project Outcome

This project demonstrates practical knowledge of:

**Docker → Docker Compose → GitHub → Jenkins CI/CD → AWS EC2 → Prometheus → Grafana**

It provides an end-to-end **automated deployment and monitoring workflow** for a multi-tier application.

> **Build → Automate → Deploy → Monitor**
