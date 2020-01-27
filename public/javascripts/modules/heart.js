import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e){
    e.preventDefault();
    //console.log('Heart OKKKKKKKKKK')
    //console.log(this)
    axios
    .post(this.action)
    .then(res => {
        //console.log(res.data);
        const isHearded = this.heart.classList.toggle('heart__button--heated');
        //console.log(isHearded); mis a jours chiffre
        $('.heart-count').textContent = res.data.hearts.length;
        if(isHearded){
            this.heart.classList.add('heart__button--float');
            setTimeout( ()=> this.heart.classList.remove('heart__button--float'),250);
        }

    })
    .catch(console.error);
}

export default ajaxHeart;