// 전체적으로 이 JS는 The Can Store를 기반으로 구현했습니다
// https://mdn.github.io/learning-area/javascript/apis/fetching-data/can-store/


//Dom load될 시, first post를 render한다.
document.addEventListener('DOMContentLoaded', load);

function load(){
    //Promise 사용
    fetch('product2.json').then(function(response){
        return response.json();
    }).then(function(json){
        let prod = json;
        item_num = prod.length;
        initialize(prod);
    }).catch(function(error){
        console.log('Fetch Error: ' + error.message);
    });
}

// 1 페이지에 최대 출력 가능한 제품 수: 짝수개를 유지해서 2개씩 짝지여서 출력되도록 한다.
let page_max_num = 6;
// infinite scroll 부른 횟수를 저장한다
let count = 0;
// 특정 category/text 검색에 해당하는 아이템의 갯수를 
let item_num = 0;
// 특정 환경에서 infinite scroll이 최대로 불러질 수 있는 횟수를 저장한다.
let count_max = 0;
// infinite scroll을 지금 해야하는지 하지 말아야하는지 판단할 때 사용된다.
let infinite_sc = false;
window.onscroll = function(e){
    if((window.innerHeight + window.scrollY) >= document.body.offsetHeight ){
        //이미 측정된 count_max보다 count가 같거나 크면, infinite scroll을 할 필요가 없다.
        if(count < count_max){
            count++;
            load();
            infinite_sc = true;
        }
        // 그 외의 경우에는 infinite_sc를 false로 둔다
        else{
            infinite_sc = false;
        }
       
    }
}


//page의 기본 logic 등 구현
function initialize(products){

    // 선택한 필터 카테고리
    const category = document.querySelector('#category_select');
    // 검색할 단어
    const search_item = document.querySelector('#search_item');
    // 검색단어 입력 후, 검색버튼을 누를 시 그걸 컨트롤할 변수
    const search_btn = document.querySelector('button');
    // 제품들을 보여줄 공간
    const data_main = document.querySelector('#main_data');

    // 그전에 어떠한 카테고리를 선택했는지 기억
    let prev_category = category.value;
    // 기존 검색 단어는 날리기
    let prev_search = '';

    // category_group을 생성, 카테고리/검색어를 통해 필터한 결과를 저장
    // final_group을 생성, display할 내용을 저장
    let category_group;
    let final_group;
  
    // 첫 시작은 전부 다 보여줘야 하므로, 일단 final group을 products로 초기화, display
    // 또한 item num이 정해져있지 않아서, 그 값을 초기화한다.
    final_group = products;
    item_num = products.length;
    updateDisplay();

    // 검색을 위해 둘 다 비워두기
    category_group = [];
    final_group = [];

    // 검색 버튼이 클릭되면 selectCategory 함수 부르기
    search_btn.onclick = selectCategory;


    // 검색버튼 클릭될 시, 카테고리 필터링 할 방법 확인
    function selectCategory(e){
        // form submitting을 멈춘다
        e.preventDefault();

        // 기존 검색기록을 초기화
        category_group = [];
        final_group = [];

        // 기존 category와 값이 같고 검색 text도 동일할 시, 기존과 동일함->함수 종료
        if(category.value === prev_category && search_item.value.trim() === prev_search) {
            return;
        }
        // 동일하지 않을 시, 검색 진행
        else{
            // 사용자가 입력한 검색값 및 카테고리를 저장
            prev_category = category.value;
            prev_search = search_item.value.trim();

            // 우선적으로 category의 값을 확인해야함
            // category 값이 변했기 때문에, category의 element의 갯수 등을 초기화시켜야한다.
            // ALL이면, 모든 json 데이터들을 selectProduct에 전달
            // 이 경우는, category가 바뀌어서 all인 경우이므로, 화면을 지워야함->infinite scroll_ing가 false여야한다

            count = 0;
            infinite_sc = false;
            
            if(category.value === 'All'){
                category_group = products;
                item_num = products.length;
                selectProducts();
            }
            // 아니면 필터링해야한다
            else{
                // json 데이터 필터링
                for(let i = 0; i < products.length ; i++) {
                    // book_type가 동일할 경우, category_group에 넣는다
                    if(products[i].book_type === category.value) {
                        category_group.push(products[i]);
                    }
                }
                // 필터링이 끝났기 때문에, 검색어로 필터링을 위해 selectProducts()를 실행한다.
                selectProducts();
            }
        }   
    }

    // 카테고리로 필터링 후, 검색어로 필터링 하기 위해, 함수를 만든다.
    function selectProducts(){
        // 만약 검색어가 존재한다면(''이 아니라면), display에 출력, 아니면 그냥 그대로 출력한다.
        if(search_item.value.trim() === ''){
            final_group = category_group;
            item_num = category_group.length;
            updateDisplay();
        }
        else{
            // 검색어를 검색할 때, 대소문자로 인한 오류 발생을 막기 위하여 전부 소문자로 바꾼다
            let lower_search_item = search_item.value.trim().toLowerCase();

            // 검색어에 해당되는 것이 있는지 확인하여, 일치하면 출력할 finalgroup에 push한다
            for(let i=0; i<category_group.length; i++){
                if(category_group[i].book_name.toLowerCase().indexOf(lower_search_item) !== -1){
                    final_group.push(category_group[i]);
                    item_num++;
                }
            }
            // 검색어 필터링이 완료되었기에, 출력한다.
            updateDisplay();
        }

        
    }

    // 화면에 출력을 담당하는 함수를 설정한다.
    function updateDisplay(){
        //count의 최댓값 설정
        count_max = (item_num-(item_num%page_max_num))/page_max_num+1;
        // 만약 infinite scroll중이라면, 기존내용을 지우면 안되므로, 이걸 구분해야한다.
        if(infinite_sc){
            //특정 item들을 추가로 인쇄한다.
            for(let i=count*page_max_num; (i<final_group.length) && (i<(1+count)*page_max_num); i++){
                fetchBlob(final_group[i]);
            }
        }
        //기존 내용을 지우는 경우는, 검색 등과 같이 특정으로 변할 때 사용된다.
        else{
            //기존 내용들을 지운다.
            while(data_main.firstChild){
                data_main.removeChild(data_main.firstChild);
            }

            // 만약 검색결과가 없다면, 검색결과가 없음을 출력한다. 
            if(final_group.length === 0){
                const para = document.createElement('p');
                para.textContent = "검색결과가 없습니다! 다시 확인해주세요."
                data_main.appendChild(para);
            }
            // 검색결과가 있다면, fetchBlob함수에 넘겨서 출력을 위한 변환과정을 거친다.
            else{
                for(let i=0; i<final_group.length && i<page_max_num; i++){
                    fetchBlob(final_group[i]);
                }
            }
        }
    }


    // fetchBlob 함수는 image의 URL을 만들어주는 과정을 거친다.
    // image들은 images라는 폴더 안에 존재한다.
    function fetchBlob(product){
        // image url의 text값을 지정해준다.
        let url = './images/' + product.book_image;

        // fetch로 이미지 fetch 후, response해준다.
        // blob형태로 response하면, 이걸 받아서 URL을 생성해준다.
        fetch(url).then(function(response){
            return response.blob();
        }).then(function(blob){
            // URL을 생성해준다.
            let object_url = URL.createObjectURL(blob);
            // product를 인쇄한다.
            showProduct(object_url, product);
        });
    }

    
    // product들을 data_main 안에다가 나열해주는 함수이다.
    function showProduct(objectURL, product){
        // 각종 element를 생성하여 product의 정보를 작성한다.
        const section = document.createElement('section');
        const heading = document.createElement('h2');
        const para = document.createElement('p');
        const quality = document.createElement('p');
        const image = document.createElement('img');
        const button = document.createElement('button');
        button.textContent = 'More';
        
        // section의 class를 property로 설정한다.
        section.setAttribute('class', product.book_type);

        //  h2 element에다 상품의 이름을 저장한다.
        heading.textContent = product.book_name;

        // p element에다 제품의 가격을 설정하고, CSS 설정을 위해 class를 부여한다.
        para.textContent = product.book_price + '₩';
        para.setAttribute('class', 'price');

        // image elment의 src를 product에서 받아서 설정하고, alt도 설정해준다. 그리고 CSS 설정을 위한 class를 부여한다
        image.src = objectURL;
        image.alt = product.book_name;
        image.setAttribute('class', 'book_img');

        quality.textContent = '상태: ' + product.book_quality + '급';

        function showMore(){
            section.appendChild(heading);
            section.appendChild(quality);            
        }

        // DOM에다 해당 product를 추가한다.
        data_main.appendChild(section);
        section.appendChild(image);
        section.appendChild(para);
        section.appendChild(button);
        button.onclick = showMore;

    }
}