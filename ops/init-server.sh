# Run for new servers

sudo apt update
sudo apt dist-upgrade -y

# docker
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
apt-cache policy docker-ce
sudo apt install docker-ce -y

sudo usermod -aG docker ${USER}
sudo chmod 666 /var/run/docker.sock
docker run hello-world

# Postgres
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /etc/apt/trusted.gpg.d/pgdg.asc &>/dev/null
sudo apt update
sudo apt install postgresql-15 postgresql-client-15 -y
sudo systemctl enable postgresql

sudo -u postgres psql
# ALTER USER postgres WITH ENCRYPTED PASSWORD '[adminPassword]';
# CREATE USER [Username] WITH ENCRYPTED PASSWORD '[Password]';
# ALTER ROLE [Username] WITH SUPERUSER LOGIN;
# CREATE DATABASE [DatabaseName];
# GRANT ALL PRIVILEGES ON DATABASE [DatabaseName] TO [Username];

# Node.js
curl -sL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt install nodejs

# Nginx
UBUNTU_VERSION=$(lsb_release -cs)
echo "deb https://nginx.org/packages/ubuntu/ $UBUNTU_VERSION nginx" | sudo tee /etc/apt/sources.list.d/nginx.list
echo "deb-src https://nginx.org/packages/ubuntu/ $UBUNTU_VERSION nginx" | sudo tee -a /etc/apt/sources.list.d/nginx.list
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys ABF5BD827BD9BF62
sudo apt update
sudo apt install -y nginx

# ssh-key
ssh-keygen -t rsa -b 4096 -C "aimm-stage"

# git
git clone git@github.com:blaesus/aimm.git

# prisma
cd ~/aimm/
npm install
npx prisma generate

vim ops/.env.remote # Add params for APIs
ln -s ops/.env.remote .env

sudo mkdir /var/benches
sudo chown ubuntu:ubuntu /var/benches

# TLS Certs
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo vim /etc/nginx/conf.d/default.conf
sudo certbot --nginx -d stage.aimm.dev
