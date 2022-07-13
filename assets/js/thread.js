function changeName() {
  const photo = document.getElementById('file-photo').files[0];
  const photoElement = document.getElementById('photo-name');

  const video = document.getElementById('file-video').files[0];
  const videoElement = document.getElementById('video-name');

  if (photo) {
    photoElement.innerHTML = photo.name;
  }
  if (video) {
    videoElement.innerHTML = video.name;
  }
}

async function addThread() {
  const content = document.getElementById('content').value;
  const hastag = document.getElementById('hastag').value;
  const photo = document.getElementById('file-photo').files[0];
  const video = document.getElementById('file-video').files[0];

  let thread = {
    content,
    hastag,
  };

  if (photo) {
    const { data, error } =
      await kontenbaseClient.storage.upload(photo);
    thread.photo = [data];
  }

  if (video) {
    const { data, error } =
      await kontenbaseClient.storage.upload(video);
    thread.video = [data];
  }

  await kontenbaseClient.service('thread').create(thread);

  document.getElementById('form-thread').reset();
  getThreads();
}

let threads = [];

async function getThreads() {
  const { data, error } = await kontenbaseClient.service('thread').find();

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

getThreads();