const express = require('express')
const router = express.Router()
const { ensureAuth } = require('../middleware/auth')

const Story = require('../models/Story')


// @desc    Show add page
// @route   GET /stories/add
router.get('/add', ensureAuth, (req, res) => {
    res.render('stories/add')
})


// @desc    Process add form
// @route   POST /stories
router.post('/', ensureAuth, async (req, res) => {
  try {
    req.body.user = req.user.id
    await Story.create(req.body)
    res.redirect('/posts')
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

// @desc    Show post
// @route   GET /stories/:id
router.get('/:id', ensureAuth, async (req, res) => {
  try{
let story=await Story.findById(req.params.id).populate('user').lean()

if(!story){
  return res.render('error/404')
}

res.render('stories/post',{
  story
})
  }catch(err){
    console.error(err);
    res.render('error/404')
  }
})

// @desc    Edit post
// @route   POST /stories/edit/:id
router.get('/edit/:id', ensureAuth, async (req, res) => {
  try{
    const story= await Story.findOne({
      _id:req.params.id
    }).lean()
  
    if(!story){
      return res.render('error/404')
    }
  
    if(story.user != req.user.id){
      res.redirect('/posts')
    }else{
      res.render('stories/edit',{
        story
      })
    }
  }catch(err){
    console.error(err);
  }
  
})

// @desc    Update post
// @route   PUT/stories/:id
router.put('/:id', ensureAuth, async(req, res) => {
  try{
    let story=await Story.findById(req.params.id).lean()

    if(!story){
      return res.render("error/404")
    }
    
    if(story.user != req.user.id){
      res.redirect('/stories')
    }else{
     story= await Story.findOneAndUpdate({_id: req.params.id}, req.body,{
       new:true,
       runValidators:true
     })
    
     res.redirect('/posts')
    }
  }catch(err){
    console.error(err);
    return res.render("error/500")
      }
})

// @desc    Delete post
// @route   DELETE /stories/:id
router.delete('/:id', ensureAuth, async (req, res) => {
  try{
await Story.remove({_id:req.params.id})
res.redirect("/posts")
  }catch(err){
console.error(err);
return res.render("error/500")
  }
})


module.exports=router;
