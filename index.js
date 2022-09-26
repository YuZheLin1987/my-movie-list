const BASE_URL = 'https://movie-list.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/v1/movies/'
const POSTER_URL = BASE_URL + '/posters/'
const MOVIES_PER_PAGE = 12

const movies = []
let filteredMovies = []
// 紀錄目前頁面，載入預設為第一頁
let currentPage = 1

const dataPanel = document.querySelector('#data-panel')
const searchForm = document.querySelector('#search-form')
const searchInput = document.querySelector('#search-input')
const paginator = document.querySelector('#paginator')
const table = document.querySelector('.table')

// 顯示模式有兩種
const DISPLAY_MODE = {
  CardMode: "CardMode",
  ListMode: "ListMode"
}
// 預設一開始載入卡片模式
let currentMode = DISPLAY_MODE.CardMode

function renderMovieList(data) {
  let rawHTML = ''
  
  // 依照顯示模式來決定如何渲染網頁
  switch (currentMode) {
    case DISPLAY_MODE.ListMode:
      rawHTML += `
        <table class="table table-striped">
      </tbody>`

      data.forEach(item => {
        rawHTML += `
          <tr>
            <th scope="row">${item.title}</th>
            <td>
              <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal" data-id="${item.id}">More</button>
              <button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>
            </td>
          </tr>`
      })

      rawHTML += `
        </tbody>
      </table>`

      dataPanel.innerHTML = rawHTML
      return
    case DISPLAY_MODE.CardMode:
      data.forEach(item => {
        rawHTML += `
        <div class="col-sm-3">
            <div class="mb-2">
              <div class="card">
                <img src=${POSTER_URL + item.image} class="card-img-top" alt="Movie Poster">
                <div class="card-body">
                  <h5 class="card-title">${item.title}</h5>
                </div>
                <div class="card-footer">
                  <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal" data-id="${item.id}">More</button>
                  <button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>
                </div>
              </div>
            </div>
          </div>`
      })
      
      dataPanel.innerHTML = rawHTML
      return
  }
  
}

function renderPaginator(amount) {
  const numberOfPages = Math.ceil(amount / MOVIES_PER_PAGE)
  let rawHTML = ''

  // 一開始顯示第一頁，所以直接將第一頁加入active反白
  for (let page = 1; page <= numberOfPages; page++) {
    if (page === 1) {
      rawHTML += `<li class="page-item active"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`
    } else {
      rawHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`
    }
  }

  paginator.innerHTML = rawHTML
}

function getMoviesByPage(page) {
  const data = filteredMovies.length ? filteredMovies : movies
  const startIndex = (page - 1) * MOVIES_PER_PAGE
  return data.slice(startIndex, startIndex + MOVIES_PER_PAGE)
}

// 將點擊的頁面反白，讓使用者知道現在在第幾頁
function pageActive(page) {
  const children = paginator.children
  
  if (currentPage === page) return
  
  children[currentPage - 1].classList.remove('active')
  currentPage = page
  children[page - 1].classList.add('active')
}

function showMovieModal(id) {
  const modalTitle = document.querySelector('#movie-modal-title')
  const modalImage = document.querySelector('#movie-modal-image')
  const modalDate = document.querySelector('#movie-modal-date')
  const modalDescription = document.querySelector('#movie-modal-description')

  axios.get(INDEX_URL + id).then((response) => {
    const data = response.data.results
    modalTitle.innerText = data.title
    modalDate.innerText = 'Release date: ' + data.release_date
    modalDescription.innerText = data.description
    modalImage.innerHTML = `<img src="${POSTER_URL +  data.image}" alt="movie-poster">`
  })
  .catch((err) => console.log(err))
}

function addToFavorite(id) {
  const list = JSON.parse(localStorage.getItem('favoriteMovies')) || []
  const movie = movies.find(movie => movie.id === id)

  if (list.some(movie => movie.id === id)) {
    return alert('此電影已在收藏清單中')
  }
  list.push(movie)
  alert(`加入${movie.title}`)
  localStorage.setItem('favoriteMovies', JSON.stringify(list))
}

dataPanel.addEventListener('click', function onPanelClicked(event) {
  if (event.target.matches('.btn-show-movie')) {
    showMovieModal(Number(event.target.dataset.id))
  } else if (event.target.matches('.btn-add-favorite')) {
    addToFavorite(Number(event.target.dataset.id))
  }
})

paginator.addEventListener('click', function onPaginatorClicked(event) {
  if (event.target.tagName !== 'A') return
  const page = Number(event.target.dataset.page)

  renderMovieList(getMoviesByPage(page))
  // 將點擊的頁面反白
  pageActive(page)
})

searchForm.addEventListener('submit', function onSearchFormSubmitted(event) {
  event.preventDefault()
  const keyword = searchInput.value.trim().toLowerCase()
  
  filteredMovies = movies.filter((movie) => movie.title.toLowerCase().includes(keyword))

  if(filteredMovies.length === 0) {
    return alert('Cannot find movies with keyword: ' + keyword)
  }

  renderPaginator(filteredMovies.length)
  renderMovieList(getMoviesByPage(1))
})

// 監控點擊切換模式圖片(兩個條件的概念相同，故註解只寫一次)
searchForm.addEventListener('click', function onDisplayModeChangeClicked(event) {
  if (event.target.classList.contains('card-mode')) {
    // 點擊相同模式不執行任何動作
    if (currentMode === DISPLAY_MODE.CardMode) return
    
    currentMode = DISPLAY_MODE.CardMode
    dataPanel.innerText = ''
    // 切換顯示模式時維持目前頁面
    renderMovieList(getMoviesByPage(currentPage))
  } else if (event.target.classList.contains('list-mode')) {
    if (currentMode === DISPLAY_MODE.ListMode) return

    currentMode = DISPLAY_MODE.ListMode
    dataPanel.innerText = ''
    renderMovieList(getMoviesByPage(currentPage))
  }
})

axios.get(INDEX_URL).then((response) => {
  movies.push(...response.data.results)
  renderPaginator(movies.length)
  renderMovieList(getMoviesByPage(1))
})
.catch((err) => console.log(err))