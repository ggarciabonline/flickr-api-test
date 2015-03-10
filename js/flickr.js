//Global Vars
var currentPage = 1;
var thumbPerRow = 5;
var thumbPerPage = 15;
var totalImages = 150;
var apiSearchMethod = 'flickr.photos.search';
var apiGetRecent = 'flickr.photos.getRecent';
var timeFadeAnim = 1000;
//Global Arrays
var allImages = [];
var allUsers = [];

$(function() {
	
	flickrAPI(currentPage, null, apiGetRecent);
	setPagination();
	
	$("#carousel-img").on( 'click', 'span', function() { 
		carouselId = getCarouselId();

		var firstImagePage = (currentPage - 1) * thumbPerPage;
		var lengthThumb = firstImagePage + thumbPerPage;

		if ($(this).attr('class') == 'right') {
			if (carouselId < lengthThumb ) { carouselId++;} 
			if (carouselId == lengthThumb) {carouselId = firstImagePage;}
		}
		else if ($(this).attr('class') == 'left') {
			if (carouselId > firstImagePage ) { carouselId--; } 
			else if (carouselId <= firstImagePage) { lengthThumb--; carouselId = lengthThumb; } 
		}
		carouselAnimation();
	});
	$(".pagination").on( 'click', 'li', function() {

		$('#page-'+currentPage).removeClass('active');

		if ($(this).attr('id') == 'next') {
			currentPage++;
			if (currentPage <= 10) { pagesUpdate(currentPage); }
			else {currentPage = 1;pagesUpdate(currentPage);}
		}
		else if ($(this).attr('id') == 'previous') {
			currentPage--;
			if (currentPage >= 1) { pagesUpdate(currentPage); }
			else {currentPage = totalImages/thumbPerPage; pagesUpdate(currentPage);}
		}
		else if ($(this).attr('id') == 'first') {
			currentPage = 1;
			pagesUpdate(currentPage);
		}
		else if ($(this).attr('id') == 'last') {
			currentPage = totalImages/thumbPerPage;

			pagesUpdate(currentPage);
		}
		else if ($(this).attr('class') == 'page-nav') {
			var id = $(this).attr('id');
			currentPage = lastChar(id);
			pagesUpdate(currentPage);
		}
	});
	$("#images-box").on( "click", "img", function() {
		var thumbnailId = $(this).attr('id');
		carouselId = lastChar(thumbnailId);
		$("#carousel-img").empty();
		carouselLoad(carouselId);
	});
  	$('#search').click(function(){
    	var query = $(".search-box").val();
    	if (query !== "") { flickrAPI(currentPage, query, apiSearchMethod); }
  	});
  	$(".search-box").keypress(function (e) {
		var key = e.which;
	 	if(key == 13) { $("#search").click();return false; }
	});
});
function flickrAPI (pageNumber, queryString, methodAPI) {
	var apiSearch = queryString;

	if (queryString) {
		apiSearch = '&text='+queryString;
		allImages = [];
		allUsers = [];
	}
	$.ajax({
		url: 'https://api.flickr.com/services/rest/?method='+methodAPI+'&api_key=993ad07e11fa6943e6496e6bd045ff6c&per_page='+totalImages+'&page='+currentPage+'&format=json&nojsoncallback=1'+apiSearch,
	}).done(function (data) {
			var images = data.photos.photo;

			for (i = 0; i < images.length; i++) { 
				allUsers.push(images[i].owner);

				$.ajax({
					url: 'https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=993ad07e11fa6943e6496e6bd045ff6c&photo_id='+images[i].id+'&format=json&nojsoncallback=1',
				}).done(function(data){	
					allImages.push(data);

					if (allImages.length === totalImages) {
						cleanUp();
						displayImages(pageNumber);
					};
				});
			}
		});
}
function getUsername (idUser) {
	$.ajax({
		url:'https://api.flickr.com/services/rest/?method=flickr.people.getInfo&api_key=993ad07e11fa6943e6496e6bd045ff6c&user_id='+idUser+'&format=json&nojsoncallback=1'
	}).done(function(data){
		var userName = data.person.username._content;

		$("#owner").empty();
		$("#owner").append("Photographer Credit: "+userName);
	});
}
function displayImages (pageNumber) {
	var firstImagePage = (pageNumber - 1) * thumbPerPage;
	var lengthThumb = firstImagePage + thumbPerPage;
	
	var counterImgRow = 1;
	var e = firstImagePage;

	while (firstImagePage < lengthThumb) {
		
		carouselLoad(firstImagePage);
		var urlThumb = allImages[firstImagePage].sizes.size[1].source;

		//thumbnails wrapper
		if (firstImagePage == e) {
			$("#images-box").append('<div class="row-'+counterImgRow+'"><div class="inner-image"></div></div>');
			counterImgRow++;
			e = firstImagePage + thumbPerRow;
		}
		$('#images-box').children('.row-'+(counterImgRow-1))
						.children()
						.append('<div class="frame"><img id="thumb-'+(firstImagePage)+'" class="image-thumbnail" src="'+urlThumb+'"></div>');
		firstImagePage++;
	}
}
function carouselLoad (imageId) {
	var carousel = $("#carousel-img");
	//-2 gets before largest image
	var largeImage = allImages[imageId].sizes.size.length-2;
	var urlCarousel = allImages[imageId].sizes.size[largeImage].source;
	//check aspect ratio
	var width = allImages[imageId].sizes.size[largeImage].width;
	var height = allImages[imageId].sizes.size[largeImage].height;
	
	if (width <= height) { carousel.addClass("portrait"); }
	else {carousel.removeClass("portrait");}
	
	if (carousel.is(':empty')){
		usernameId = allUsers[imageId];
		getUsername(usernameId);
		carousel.append('<span class="left"><i class="fa fa-angle-left"></i></span><img id="carousel-'+(imageId)+'" class="carousel-image" src="'+urlCarousel+'"><span class="right"><i class="fa fa-angle-right"></i></span>')
				.hide()
				.fadeIn(1500);
	}
}
function setPagination () {
	var pagesLength = totalImages/thumbPerPage;
	$(".pagination").append('<li id="first"><<</li>');
	$(".pagination").append('<li id="previous"><</li>');
	for (var i = 0; i < pagesLength; i++) {
		var numberPag = i + 1;
		if (currentPage == numberPag) {
			$(".pagination").append('<li id="page-'+numberPag+'" class="page-nav active">'+numberPag+'</li>');
		}
		else {
			$(".pagination").append('<li id="page-'+numberPag+'" class="page-nav">'+numberPag+'</li>');
		}
	};
	$(".pagination").append('<li id="next">></li>');
	$(".pagination").append('<li id="last">>></li>');
}
function updatePageNumbers (currentPageId) {
	var id = currentPageId;
	$('#page-'+id).addClass('active');
}
function cleanUp () {
	$("#images-box").empty();
	$("#carousel-img").empty();
}
function pagesUpdate (currentPage) {
	cleanUp();
	updatePageNumbers(currentPage);
	displayImages(currentPage);
}
function getCarouselId () {
	var idCarousel = $("#carousel-img img").attr('id');
	lastIdChar = lastChar(idCarousel);
	return lastIdChar;
}
function carouselAnimation () {
	$("#carousel-img").fadeOut(timeFadeAnim, function(){
		$(this).empty();
		carouselLoad(carouselId);
	});
}
//Return characters after hyphen
function lastChar(id) {
	var lastIdChar = id.substr(id.indexOf("-") + 1);
	return lastIdChar;
}