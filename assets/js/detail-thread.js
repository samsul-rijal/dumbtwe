const API_KEY = 'aea64958-96f0-45dc-b3cc-e9991afd890e'

const kontenbaseClient = new kontenbase.KontenbaseClient({
    apiKey: API_KEY
})

let id = ''

async function getDetailThread(){
    id = new URL(window.location.href).searchParams.get("id")

    const {data, error} = await kontenbaseClient.service("thread").getById(id)
    console.log(data);
    renderDetailThread(data)
}
getDetailThread()

async function renderDetailThread(data){

    let thread = document.getElementById("thread-detail")

    thread.innerHTML = `
    <div class="middle-side" id="thread-detail">
        <div class="card p-20">
            <div class="view-thread">
                <div class="left">
                    <img src="./assets/img/profile.jpg" alt="">
                </div>
                <div class="right">
                    <div class="top">
                        <div class="profile-user">
                            <div>
                                <h3>Ilham Fathullah</h3>
                                <span>@ilham</span>
                            </div>
                            <span>33 minutes ago</span>
                        </div>
                        <div class="options">
                            <i onclick="renderEditThread()" class="fa-solid fa-pen" style="font-size: 15px; margin-right: 10px"></i> 
                            <i onclick="deleteThread()" class="fa-solid fa-trash" style="font-size: 15px; color: rgb(193, 48, 48)"></i>          
                        </div>
                    </div>
                    <div class="content-thread">
                        <p>
                            ${data.content}
                        </p>
                        <p>
                            ${data.photo ? `<img src="${data.photo[0].url}" />` : ''}
                        </p>
                        
                    </div>
                    <div class="bottom">
                        <div class="react-view">
                            <div class="react-group">
                                <i class="fa-solid fa-heart"></i><span>${await getThreadLike(data._id)}</span>
                            </div>
                            <div class="react-group">
                                <i class="fa-solid fa-comment-dots"></i><span>${await getThreadCommentCount(data._id)}</span>
                            </div>
                        </div>
                        <div class="react-button">
                            ${(await checkUserLike(data._id)) ? 
                                `
                                <button class="btn-dislike" onclick="dislikeThread('${data._id}'); event.stopPropagation()">
                                    <i class="fa-solid fa-heart"></i> Like
                                </button>
                                `
                                :
                                `
                                <button class="btn-like" onclick="likeThread('${data._id}'); event.stopPropagation()">
                                    <i class="fa-solid fa-heart"></i> Like
                                </button>
                                `
                            }
                            <button class="btn-comment" onclick="document.getElementById('comment-message').select()">
                                <i class=" fa-solid fa-comment-dots"></i> Comment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
}

async function renderEditThread(){

    const {data, error} = await kontenbaseClient.service("thread").getById(id)

    let thread = document.getElementById("thread-detail")

    thread.innerHTML = `
    <div class="card p-20 post-thread">
        <div class="left">
            <img src="./assets/img/profile.jpg" alt="" id="avatar-thread">
        </div>
        <div class="right">
            <form id="form-thread">
                <textarea id="content" placeholder="What's happening?" rows="5">${data.content}</textarea>
                <input id="hastag" type="text" placeholder="# Hastag (optional)" value="${data.hastag}">
                <div class="file-button-group">
                    <div class="file">
                        <label for="file-photo">
                            <i class="fa-solid fa-image"></i><span id="photo-name"> Photo</span>
                        </label>
                        <input type="file" hidden id="file-photo" onchange="changeName()">
                        <label for="file-video">
                            <i class="fa-solid fa-circle-play"></i><span id="video-name"> Video</span>
                        </label>
                        <input type="file" hidden id="file-video" onchange="changeName()">
                    </div>
                    <div class="btn-publish">
                        <button type="button" onclick="getDetailThread()" >Cancel</button>
                        <button type="button" onclick="updateThread()" >Update</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
    `
}

function changeName(){
    const photo = document.getElementById("file-photo").files[0]
    const photoElement = document.getElementById("photo-name")

    const video = document.getElementById("file-video").files[0]
    const videoElement = document.getElementById("video-name")

    if(photo){
        photoElement.innerHTML = photo.name
    }

    if(video){
        videoElement.innerHTML = video.name
    }
}

async function updateThread(){
    const content = document.getElementById("content").value
    const hastag = document.getElementById("hastag").value
    const photo = document.getElementById("file-photo").files[0]
    const video = document.getElementById("file-video").files[0]

    let thread = {
        content,
        hastag
    }

    if(photo){
        const {data, error} = await kontenbaseClient.storage.upload(photo)
        thread.photo = [data]
    }

    if(video){
        const {data, error} = await kontenbaseClient.storage.upload(video)
        thread.video = [data]
    }

    await kontenbaseClient.service("thread")
    .updateById(id, thread)
    
    getDetailThread()
}

async function deleteThread(){

    await kontenbaseClient.service("thread").deleteById(id)

    window.location.href = "beranda.html"
}

async function getThreadLike(id){

    const {data, error} = await kontenbaseClient.service("like").count({
      where: {thread: id}
    })
  
    return data.count;
}
  
async function likeThread(id){
    const {user, error: errorUser} = await kontenbaseClient.auth.user()
  
    if(errorUser){
      return console.log(errorUser);
    }
  
    const {data, error} = await kontenbaseClient.service("like").create({
      thread: [id],
      Users: [user._id]
    })
  
    if(error){
      console.log(error);
    }
  
    getDetailThread()
}
  
async function checkUserLike(threadId){
  
    const {user, error: errorUser} = await kontenbaseClient.auth.user()
  
    const {data, error } = await kontenbaseClient.service("like").find({
      where: {
        thread: [threadId],
        Users: [user._id]
      }
    })
  
    const isLike = data.length != 0 ? true : false
    return isLike
}
  
async function dislikeThread(id){
  
    const {user, error: errorUser} = await kontenbaseClient.auth.user()
  
    const {data, error} = await kontenbaseClient.service("like").find({
      where: {thread: id, Users: user._id},
      lookup: '*'
    })
  
    if(error || data.length == 0){
      return console.log(error);
    }
  
    const {error: errorLike} = await kontenbaseClient.service("like").deleteById(data[0]._id)
  
    if(errorLike){
      return console.log(errorLike);
    }
  
    getDetailThread()
}
  
async function getThreadCommentCount(id){
    const {data, error} = await kontenbaseClient.service("comment").count({
      where: {thread: id}
    })
  
    return data.count
}

async function commentThread(){

    const message = document.getElementById("comment-message")

    const {user, error: errorUser} = await kontenbaseClient.auth.user()

    if(errorUser){
        return console.log(errorUser);
    }

    const {data, error} = await kontenbaseClient.service("comment").create({
        message: message.value,
        thread: [id],
        Users: [user._id]
    })

    message.value = ''

    getDetailThread()
    getCommentThread()
}

async function getCommentThread(){
    id = new URL(window.location.href).searchParams.get('id')

    const {data, error} = await kontenbaseClient.service("comment").find({
        where: {thread: id},
        lookup: '*'
    })

    if(error){
        return console.log(error);
    }

    const commentElement = document.getElementById("comment-list")
    commentElement.innerHTML = ''

    await data.forEach((item, index)=>{
        commentElement.innerHTML += `
                                        <div class="comment-item">
                                            <div class="comment-message">
                                                ${item.Users[0].username ? item.Users[0].username : item.Users[0].firstName}
                                            </div>
                                            <div>
                                                ${item.message}
                                            </div>
                                        <div>
        `
    })
}

getCommentThread()