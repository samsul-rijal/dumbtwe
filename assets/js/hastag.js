const API_KEY = 'aea64958-96f0-45dc-b3cc-e9991afd890e'

const kontenbaseClient = new kontenbase.KontenbaseClient({
    apiKey: API_KEY
})

let threads = []

async function getThreads() {

    const hastag = localStorage.getItem("hastag")
    document.getElementById("search-bar").value = '#' + hastag

    const { data, error } = await kontenbaseClient.service('thread').find({
        where: {hastag: hastag}
    });
  
    if (data) {
      threads = data;
      renderThreads();
    } else {
      console.log(error);
    }
}

async function renderThreads() {
    let threadContainer = document.getElementById('thread-container');
    threadContainer.innerHTML = '';
    for (let i = 0; i < threads.length; i++) {
      threadContainer.innerHTML += `
            <div class="card p-20 view-thread" onclick="location.href='detail-thread.html?id=${threads[i]._id}'">
              <div class="left">
              <img src="${threads[i].owner.avatar[0].url}" alt="">
              </div>
              <div class="right">
                <div class="top">
                  <div class="profile-user">
                    <div>
                      <h3>${threads[i].owner.firstName}</h3>
                      <span>${threads[i].owner.username}</span>
                    </div>
                    <span>33 minutes ago</span>
                  </div>
                  <div class="options">
                    <i class="fa-solid fa-ellipsis"></i>
                  </div>
                </div>
                <div class="content-thread">
                  <p>
                    ${threads[i].content}
                  </p>
                  <a onclick="navigateHastag('${threads[i].hastag}'); event.stopPropagation()">
                    <p>
                      #${threads[i].hastag}
                    </p>
                  </a>
                  ${threads[i].photo ? `<img src=" ${threads[i].photo[0].url}" alt="">` : ''}
                </div>
                <div class="bottom">
                  <div class="react-view">
                    <div class="react-group">
                      <i class="fa-solid fa-heart"></i><span>${await getThreadLike(threads[i]._id)}</span>
                    </div>
                    <div class="react-group">
                      <i class="fa-solid fa-comment-dots"></i><span>${await getThreadCommentCount(threads[i]._id)}</span>
                    </div>
                  </div>
                  <div class="react-button">
                    ${(await checkUserLike(threads[i]._id)) ? 
                      `
                        <button class="btn-dislike" onclick="dislikeThread('${threads[i]._id}'); event.stopPropagation()">
                          <i class="fa-solid fa-heart"></i> Like
                        </button>
                      `
                      :
                      `
                        <button class="btn-like" onclick="likeThread('${threads[i]._id}'); event.stopPropagation()">
                          <i class="fa-solid fa-heart"></i> Like
                        </button>
                      `
                    }
                    <button class="btn-comment">
                      <i class=" fa-solid fa-comment-dots"></i> Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
            `;
    }
}

async function renderProfile(){
    const {user, error} = await kontenbaseClient.auth.user()
    if(user){
        let avatarProfile = document.getElementById("avatar-profile")
        let threadProfile = document.getElementById("avatar-thread")

        let fullname = document.getElementById("fullname")
        let username = document.getElementById("username")
        let biodata = document.getElementById("biodata")

        fullname.innerHTML = user.firstName
        if(user.username){
            username.innerHTML = '@' + user.username
        } else {
            username.innerHTML = "@"
        }

        if(user.biodata){
            biodata.innerHTML = user.biodata
        } else {
            biodata.innerHTML = "-"
        }

        avatarProfile.src = user.avatar[0].url
    }

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
  
    getThreads()
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
  
    getThreads()
  }
  
  async function getThreadCommentCount(id){
    const {data, error} = await kontenbaseClient.service("comment").count({
      where: {thread: id}
    })
  
    return data.count
  }

renderProfile()
getThreads()
