const { MongoClient } = require('mongodb');

// MongoDB 连接 URL，包括用户名和密码
const uri = 'mongodb://13.113.190.142:27017/kahootDB';

async function connectToMongoDB() {
  const client = new MongoClient(uri);

  try {
    // 连接到 MongoDB
    await client.connect();
    console.log('Connected to MongoDB');

    // 选择要使用的数据库
    const db = client.db(); // 不需要在这里指定数据库名称，因为已经在连接字符串中提供了

    // 在这里执行数据库操作
    // 例如：查询数据、插入数据、更新数据等

    // 示例：查询集合中的数据
    const collection = db.collection('kahootGames'); // 指定集合
    // const collection = db.collection('your_collection_name'); // 替换为你的集合名称
    const documents = await collection.find({}).toArray();

    // 插入一条记录
    const result = await collection.insertOne({
      name: 'GameName',
      description: 'GameDescription',
      // 其他字段...
    });
    console.log('Documents:', documents);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    // 确保在完成操作后关闭连接
    await client.close();
    console.log('Connection to MongoDB closed');
  }
}

// 调用连接函数
connectToMongoDB();