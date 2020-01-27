import  axios  from 'axios';
import dompurify from 'dompurify'; // sanitize html inputs

function searchResultsHTML(stores){
    return stores.map(store =>{
        return `
        <a href="/stores/${store.slug}" class="search__result">
            <strong>${store.name}</strong>
        </a>
        
        `;
    }).join('');
}

// recherche
function typeAhead(search) {
    //console.log(search);
    if(!search) return;

    const searchInput = search.querySelector('input[name="search"]');
    const searchResults = search.querySelector('.search__results');
    //console.log(searchInput, searchResults);

    // on reduction de addListener
searchInput.on('input', function(){
    //console.log(this.value);
    // if no value quit
    if(!this.value){
        searchResults.style.display= 'none';
        return;
    }

    // search
    searchResults.style.display= 'block';
    //searchResults.innerHTML = '';

    // search
    axios
    .get(`/api/search?q=${this.value}`)
    .then(res => {
        //console.log(res.data);
        if(res.data.length){
            //console.log('Something to show!');
            //const html= searchResultsHTML(res.data);
            //console.log(html);
            searchResults.innerHTML = dompurify.sanitize( searchResultsHTML(res.data) );
            return;
        }
        // no results
        searchResults.innerHTML = dompurify.sanitize(` <div class="search__result">No results for ${this.value} found!</div>`);
    }).catch(err => {
        console.error(err);
    });
});

// handle keyboard inputs 
// arrow up, arrow down, Enter
searchInput.on('keyup', (e)=> {
    console.log(e.keyCode);
    //
    if(![38,40,13].includes(e.keyCode)){
        return; //
    }
    //console.log('Do it')
    const activeClass = 'search__result--active';
    const current = search.querySelector(`.${activeClass}`);
    const items = search.querySelectorAll('.search__result');
    let next;
    // if down 
    if(e.keyCode === 40 && current){
        next = current.nextElementSibling || items[0];
    } else if(e.keyCode === 40){
        next =items[0];
    }else if (e.keyCode === 38 && current){ // up arrow
        next = current.previousElementSibling || items[items.length - 1];
    }else if(e.keyCode === 38){
        next =items[items.length - 1];
    }else if (e.keyCode === 13 && current.href){
        window.location =current.href;
    }
    // re actualise Active
    if(current){
        current.classList.remove(activeClass);
    }
    //console.log(next)
    next.classList.add(activeClass);
})

}

export default typeAhead;