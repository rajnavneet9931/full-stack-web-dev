🚀 Full Stack Chat Application (Kubernetes + DevOps)

A production-style full-stack chat application deployed on Kubernetes, demonstrating end-to-end DevOps practices including containerization, CI/CD, autoscaling, ingress routing, and monitoring.

🌐 Live Access
http://<EC2-IP>:8081
📁 Project Structure
full-stack_chatApp/
│
├── backend/                 # Node.js + Express API
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                # React + Nginx UI
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── kubernetes/             # Kubernetes manifests
│   ├── namespace.yml
│   ├── backend-deployment.yml
│   ├── frontend-deployment.yml
│   ├── mongodb-deployment.yml
│   ├── services.yml
│   ├── ingress.yml
│   ├── backend-hpa.yml
│   ├── frontend-hpa.yml
│   └── mongodb-vpa.yml
│
├── monitoring/             # Monitoring setup
│   ├── values.yaml
│   └── helm-release.txt
│
├── docker-compose.yml      # Local development setup
├── Jenkinsfile             # CI/CD pipeline
├── kind-config.yaml        # Kind cluster config
├── README.md
└── LICENSE
🧰 Tech Stack
Frontend: React + Nginx
Backend: Node.js + Express
Database: MongoDB
Containerization: Docker
Orchestration: Kubernetes (Kind)
CI/CD: Jenkins
Monitoring: Prometheus + Grafana (Helm)
Media Storage: Cloudinary
Ingress: NGINX
⚙️ Features
Real-time chat (Socket.IO)
JWT Authentication
Profile image upload (Cloudinary)
Dockerized microservices
Kubernetes deployment
Persistent storage (PV/PVC)
Secrets management
Ingress routing
HPA (frontend + backend)
VPA (MongoDB)
CI/CD pipeline
Monitoring with Prometheus + Grafana
Real-world debugging
🐳 Docker Setup
docker build -t chatapp-backend ./backend
docker build -t chatapp-frontend ./frontend
docker-compose up -d --build
☸️ Kubernetes Setup
kind create cluster --config kind-config.yaml
kubectl apply -f kubernetes/

Access:

http://<EC2-IP>:8081
🌐 Ingress
Single entry point
Routes traffic to frontend
Production-style routing
🔄 CI/CD (Jenkins)

Pipeline stages:

Checkout → Build → Deploy → Test
📈 Autoscaling
HPA → frontend & backend
VPA → MongoDB
📊 Monitoring

Installed using Helm:

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

Access Grafana:

http://<EC2-IP>:<NODEPORT>
🔐 Environment Variables
MONGODB_URI
PORT
NODE_ENV
JWT_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
⚡ DevOps Highlights
Infrastructure as Code
CI/CD automation
Autoscaling
Monitoring & observability
Secure configuration
Production-style architecture
🚀 Future Improvements
HTTPS (TLS with Ingress)
Logging (ELK / Loki)
Helm charts
GitHub Actions
👨‍💻 Author

Navneet Chauhan
