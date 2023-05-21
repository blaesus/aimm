# Run for new servers

sudo apt update
sudo apt dist-upgrade -y

sudo apt install nginx

# docker
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
apt-cache policy docker-ce
sudo apt install docker-ce -y

sudo usermod -aG docker ${USER}
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
# CREATE DATABASE [DatabaseName];
# GRANT ALL PRIVILEGES ON DATABASE [DatabaseName] TO [Username];

# Node.js
curl -sL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt install nodejs

# Nginx
# Get the Ubuntu version
UBUNTU_VERSION=$(lsb_release -cs)

# Add the nginx repository
echo "deb https://nginx.org/packages/ubuntu/ $UBUNTU_VERSION nginx" | sudo tee /etc/apt/sources.list.d/nginx.list
echo "deb-src https://nginx.org/packages/ubuntu/ $UBUNTU_VERSION nginx" | sudo tee -a /etc/apt/sources.list.d/nginx.list

# Fetch the NGINX signing key
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys ABF5BD827BD9BF62

# Update the package list
sudo apt update

# Install nginx
sudo apt install -y nginx

# prisma
cd ~/aimm/

vim ops/.env # Add params for APIs
ln -s ops/.env.remote .env

sudo mkdir /var/benches
sudo chown ubuntu:ubuntu /var/benches
