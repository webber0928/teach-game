# teach-game
NCU 作業

## Info


## MongoDB

- Ubuntu 22.04

安裝必備套件
```
sudo apt install software-properties-common gnupg apt-transport-https ca-certificates -y
```

系統上匯入 MongoDB 的公鑰
```
curl -fsSL https://pgp.mongodb.com/server-7.0.asc |  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
```

MongoDB 7.0 APT 儲存庫新增至該/etc/apt/sources.list.d目錄
```
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

重新載入本機套件索引。
```
sudo apt update
```

安裝mongodb-org提供 MongoDB 的元包
```
sudo apt install mongodb-org -y
```

---

啟動
```
sudo systemctl start mongod
```

查看狀態
```
sudo systemctl status mongod
```

設定開機啟動
```
sudo systemctl enable mongod
```

存取 MongoDB
```
mongosh
```

基本指令
```
> show dbs #秀出現有資料庫
> use employees #建立資料庫
> db.createUser({ user: "webber", pwd: "some_password", roles: [{role: "readWrite", db: "employees"}]}) #建立一個對 employees 具有讀寫角色的使用者
> db.getUsers(); #列出建立的使用者
> show users # 同上
> db.dropUser("webber", {w: "majority", wtimeout: 4000}) #刪除用戶
```

建立管理用戶
```
$ mongosh
$ use admin

> db.createUser({ user: "AdminWebber", pwd: passwordPrompt(), roles: [{role: "userAdminAnyDatabase", db: "admin"}, "readWriteAnyDatabase"]}) #由於該角色是在admin資料庫中定義的，因此管理使用者可以讀取和修改叢集中的所有資料庫。

$ sudo vim /etc/mongod.conf
# security:
#    authorization: enabled

$ sudo systemctl restart mongod
$ sudo systemctl status mongod
$ mongosh -u AdminWebber -p --authenticationDatabase admin
```

配置遠端存取
```
$ sudo vim /etc/mongod.conf
#net:
#  port: 27017
#  bindIp: 127.0.0.1, mongo-server-ip

$ sudo systemctl restart mongod

** 如有啟用 UFW
$ sudo ufw allow from remote_machine_ip to any port 27017
$ sudo ufw reload
```

遠端存取MongoDB
```
# netcat
$ sudo apt install netcat
$ nc -zv mongodb_server_ip 27017

# mongosh
$ mongosh "mongodb://username@mongo_server_ip:27017"
```

- MongoDB 安裝:
`https://www.mongodb.com/try/download/shell`

- GUI 管理介面:
`https://www.mongodb.com/try/download/compass`

