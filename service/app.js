const express = require('express')
const { MongoClient, ObjectId } = require('mongodb')

const connectUri = 'mongodb://localhost:27017'

const dbClient = new MongoClient(connectUri)

const app = express()

//  配置解析请求体数据 application/json
app.use(express.json())

app.get('/', (req, res) => {
  res.send('hello express')
})

// 创建文章
app.post('/articles', async (req, res, next) => {
  try {
    // 1. 获取客户端表单数据
    const { articles } = req.body
    // 2. 数据验证
    if (!articles || !articles.title || !articles.description || !articles.body) {
      return res.status(422).json({
        error: '请求参数不符合要求'
      })
    }
    // 3. 插入数据库并返回响应
    await dbClient.connect()

    const collection = dbClient.db('test').collection('articles')

    articles.createdAt = new Date()
    articles.updatedAt = new Date()
    const ret = await collection.insertOne(articles)
    articles._id = ret.insertedId
    res.status(201).json({
      articles,
    })
  } catch (error) {
    next(error)
  }
})

// 分页获取文章列表
app.get('/articles', async (req, res, next) => {
  try {
    let { _page = 1, _size = 10 } = req.query
    _page = Number.parseInt(_page)
    _size = Number.parseInt(_size)
    await dbClient.connect()
    const collection = dbClient.db('test').collection('articles')
    const ret = await collection
      .find()
      .skip((_page - 1) * _size)
      .limit(_size)
    const articles = await ret.toArray()
    const articlesCounts = await collection.countDocuments()
    res.status(200).json({
      articles,
      articlesCounts
    })
  } catch (error) {
    next(error)
  }
})

// 获取单个文章
app.get('/articles/:id', async (req, res, next) => {
  try {
    await dbClient.connect()
    const collection = dbClient.db('test').collection('articles')
    
    const article = await collection.findOne({
      _id: ObjectId(req.params.id)
    })
    res.status(200).json({
      article
    })

  } catch (error) {
    next(error)
  }
})

// 更新文章
app.patch('/articles/:id', async (req, res, next) => {
  try {
    const { article } = req.body
    article.updatedAt = new Date()
    await dbClient.connect()
    const collection = dbClient.db('test').collection('articles')

    await collection.updateOne({
      _id: ObjectId(req.params.id)
    }, {
      $set: article
    })

    const updatedArticle = await collection.findOne({
      _id: ObjectId(req.params.id) 
    })

    res.status(201).json(updatedArticle)
  } catch (error) {
    next(error)
  }
})

// 删除文章
app.delete('/articles/:id', async (req, res, next) => {
  try {
    await dbClient.connect()
    const collection = dbClient.db('test').collection('articles')

    await collection.deleteOne({
      _id: ObjectId(req.params.id)
    })
    
    res.status(204).json({})
  } catch (error) {
    next(error)
  }
})

// 之前所有的路由中调用了 next(err) 都会进入此中间件
// 注意：四个参数，缺一不可
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message
  })
})

app.listen(3000, ()=> {
  console.log(`app listening at http://127.0.0.1:3000`)
})
