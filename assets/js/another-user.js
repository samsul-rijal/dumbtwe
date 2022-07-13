const API_KEY = 'aea64958-96f0-45dc-b3cc-e9991afd890e'

const kontenbaseClient = new kontenbase.KontenbaseClient({
    apiKey: API_KEY
})

let id = ''
async function renderAnotherUserProfile(){
    
    id = new URL(window.location.href).searchParams.get('id')

    let {data} = await kontenbaseClient.service('Users').find({where: {_id: id}})

    data = data[0]

    if(data){
        let avatarProfile = document.getElementById("avatar-profile")
        let threadProfile = document.getElementById("avatar-thread")

        let fullname = document.getElementById("fullname")
        let username = document.getElementById("username")
        let biodata = document.getElementById("biodata")

        fullname.innerHTML = data.firstName
        if(data.username){
            username.innerHTML = '@' + data.username
        } else {
            username.innerHTML = "@"
        }

        if(data.biodata){
            biodata.innerHTML = data.biodata
        } else {
            biodata.innerHTML = "-"
        }

        avatarProfile.src = data.avatar[0].url
        // threadProfile.src = data.avatar[0].url
    }

}

let threads = []
async function getThreads() {
    let { data, error } = await kontenbaseClient.service('thread').find();
    
    data = data.filter((item, index) => {
        if(item.owner._id === id){
            return item
        }
    })

    if(data){
        // console.log(data);
        threads = data
        renderThreads()
    } else{
        // console.log(error);
    }

    localStorage.removeItem('hastag')
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
                    <div onclick="location.href = 'another-user.html?id=${threads[i].owner._id}'; event.stopPropagation()">
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
  
  function navigateHastag(hastag){
    localStorage.setItem('hastag', hastag)
  
    window.location.href = "data-hastag.html"
  
  }

getThreads()
renderAnotherUserProfile()


async function followUser(){

  id = new URL(window.location.href).searchParams.get('id')
  let {data: dataUser} = await kontenbaseClient.service('Users').find({where: {_id: id}})
  
  const {user} = await kontenbaseClient.auth.user()

  const {data: dataFollow, error:errorFollow} = await kontenbaseClient.service("follow").find({
    where: {     
      idUserFrom: [user._id],
      idUserTo: [id]
    }
  })

  if(dataFollow.length == 0){
    const {data, error} = await kontenbaseClient.service("follow").create({
      idUserFrom: [user._id],
      idUserTo: [dataUser[0]._id]
    })
    checkFollowUser()

  } else {  
    const {data: dataUnFollow} = await kontenbaseClient.service("follow").deleteById(dataFollow[0]._id)
    checkFollowUser()
  }

}

async function checkFollowUser(){

  id = new URL(window.location.href).searchParams.get('id')
  const {user, error: errorUser} = await kontenbaseClient.auth.user()

  console.log(user);

  const {data, error } = await kontenbaseClient.service("follow").find({
    where: {
      idUserFrom: [user._id],
      idUserTo: [id]
      // idUserTo: [user._id]
    }
  })

  // console.log(data);

  let btnFollow = document.getElementById('text-follow')

  if(data.length === 0){
    btnFollow.innerHTML = 'Follow'
    document.getElementById("btn-follow").style.backgroundColor="#00C2FF";
  } else {
    btnFollow.innerHTML = 'Unfollow'
    document.getElementById("btn-follow").style.backgroundColor="grey";
  }

  if(user._id === id){
    document.getElementById("btn-follow").style.visibility = "hidden";
  }

}

checkFollowUser()

async function renderUserFollow(){

  id = new URL(window.location.href).searchParams.get('id')
  const {user, error: errorUser} = await kontenbaseClient.auth.user()

  const {data, error } = await kontenbaseClient.service("follow").find({
    where: {
      // idUserFrom: [user._id],
      idUserTo: [user._id]
    },
    lookup: '*'
  }) 

  let followContainer = document.getElementById('list-suggest');
  followContainer.innerHTML = '';
  for (let i = 0; i < data.length; i++) {
      followContainer.innerHTML += `
      <div class="suggest">
        <div class="avatar">
            <img src="${data[i].idUserFrom[0].avatar[0].url}" alt="">
        </div>

        <div class="account">
            <a href="">
            </a>
            <p>@${data[i].idUserFrom[0].username}</p>
        </div>

        <div class="btn-follow">
            <button onclick="followingUser('${data[i].idUserFrom[0]._id}')"><span id="text-follow">Follow<span/></button>
        </div>
      </div>
      
      `
  }


}

renderUserFollow()


async function followingUser(id){

  let {data: dataUser} = await kontenbaseClient.service('Users').find({where: {_id: id}})
  
  const {user} = await kontenbaseClient.auth.user()

  const {data: dataFollow, error:errorFollow} = await kontenbaseClient.service("follow").find({
    where: {     
      idUserFrom: [user._id],
      idUserTo: [id]
    }
  })

  console.log(dataFollow);
  const {data, error} = await kontenbaseClient.service("follow").create({
    idUserFrom: [user._id],
    idUserTo: [dataUser[0]._id]
  })
}