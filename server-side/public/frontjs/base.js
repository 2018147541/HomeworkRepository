




/*fetch('http://localhost:8080/main')
    .then(function(response){
         return response.json();
    }).then(function(json){                  
        first_product_list = json;
        first(first_product_list);
    })
    */
var first_product_list=clientGameState.json();   
var pnum = 0;
var firstflag = true;
var isCall = false;
first(first_product_list)


function first(product_list){
    const category = document.querySelector('#category');
    const Sword = document.querySelector('#searchT');
    const Sbutton = document.querySelector('button');
    const total =product_list.length;
    let cGroup = [];
    let fGroup = [];
    fGroup = product_list;
    update();



window.onscroll = infiniteScroll;
Sbutton.onclick = selectCategory;

function infiniteScroll(){
    let kheight = document.getElementById("k");
    if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight + kheight.offsetHeight -3) && !isCall){
        isCall = true;
        if(fGroup.length>6 && firstflag){
            for(let i = 0; i < first_product_list.length; i++) {
                Storing(first_product_list[i]);
            }
            if(pnum == 3){
                firstflag = false;
            }
            pnum = pnum + 1
        }
        setTimeout(() => {
            isCall = false;
        }, 1000);
    }
}


function selectCategory(e){
    e.preventDefault();
    cGroup = [];
    fGroup = [];
    if(category.value === 'All') {
        cGroup = product_list;
        pnum = 0;
        firstflag = true;
    }
    else{
        let lowerCaseType = category.value.toLowerCase();
        for(let i = 0; i < total ; i++){
            if(product_list[i].type == lowerCaseType){
                cGroup.push(product_list[i]);
            }
        }
    }
    searchProduct();
}

function searchProduct(){
    if(Sword.value.trim() === '') {
        fGroup = cGroup;
    } else {
      let lowerCaseSearchTerm = Sword.value.trim().toLowerCase();
      for(let i = 0; i < cGroup.length ; i++) {
        if(cGroup[i].name.indexOf(lowerCaseSearchTerm) !== -1) {
           fGroup.push(cGroup[i]);        
            }
        }
        firstflag = false;
    }
    update();
}

function update(){
    while(document.getElementById("k").firstChild){
        document.getElementById("k").removeChild(document.getElementById("k").firstChild);
    }
    if(fGroup.length == 0){
        var para = document.createElement('div');
        para.textContent = "해당 검색 결과가 없습니다.";
        document.getElementById("k").appendChild(para);
    }
    else{
        for(let i = 0; i < fGroup.length; i++) {
            Storing(fGroup[i]);
        }
        
    }
}

function Storing(product_list){
    let url = '/image/' + product_list.image;
    fetch(url).then(function(response) {
        return response.blob();
    }).then(function(blob) {
        let objectURL = URL.createObjectURL(blob);
        showProduct(objectURL, product_list);
    });

}

function showProduct(objectURL, product) {
    
    const divs = document.createElement('div');
    const heading = document.createElement('h2');
    const pp = document.createElement('p');
    const image = document.createElement('img');
    const button = document.createElement('btn');
    button.textContent= "자세히";

    
    divs.setAttribute('class', product.type);

    
    heading.textContent = product.name;
    pp.textContent = product.price +"원";
    image.src = objectURL;
    image.alt = product.name;

   
    document.getElementById("k").appendChild(divs);
    function moreinfo() {
        divs.appendChild(heading);
        divs.appendChild(pp);
    }
    divs.appendChild(image);
    divs.appendChild(button);
    button.onclick = moreinfo;
}


}



