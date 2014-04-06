//hostname which is emotion-chat-v1.herokuapp
var inbox = new ReconnectingWebSocket("ws://"+ location.host + "/receive");
var outbox = new ReconnectingWebSocket("ws://"+ location.host + "/submit");
var parentHeight = 500;

var margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
},
width = 960 - margin.left - margin.right,
height = parentHeight/3 - margin.top - margin.bottom;


var n = 6,
    m = 1,
    padding = getPadding(width),
    radius = getRadius(width),
    color = d3.scale.ordinal().domain(['rg-1','rg-2','rg-3','rg-4','rg-5','rg-6','rg-7','rg-8','rg-9','rg-10','rg-11']).range(['black','red','#919191','#660000','#f8651d','#6240a1','#f9659b','#fbfe32','#3302fb','#30cf31','white']),
    x = d3.scale.linear().domain([0,width]).range([0,width]),
    y = d3.scale.linear().domain([0,height]).range([0,height]),
    nodes = [],
    colors = [],
    lastExtRadius = 1;

for (var i in color.domain()){
  colors[color.domain()[i]] = 0;
}

// x,y is the point to test
// cx, cy is circle center, and radius is circle radius
function pointInCircle(x, y, cx, cy, radius) {
  var distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
  return distancesquared <= radius * radius;
}

function getRadiusFromCenter(cx,cy, extColor){
  for (var i in nodes){
    if (nodes[i].colorClass !== extColor){
      var x = nodes[i].x;
      var y = nodes[i].y;
      while (!pointInCircle(x,y,cx,cy,lastExtRadius)){
        lastExtRadius++;
      }
    }
  }
  console.log('radius ' + lastExtRadius + " for color " + extColor);
  return lastExtRadius;
}

d3.select(window).on('resize', resized3); 

var force = d3.layout.force()
    .nodes(nodes)
    .size([width, height])
    .gravity(0)
    .charge(0)
    .on("tick", tick);

var svg = d3.select("#bubbles").append("svg")
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

start();

function getPadding(screenWidth){
  if (screenWidth < 500) return 1;
  if (screenWidth < 750) return 2;
  if (screenWidth < 1000) return 3;
  return 4;
}

function getRadius(screenWidth){
  if (screenWidth < 500) return 3;
  if (screenWidth < 750) return 4;
  if (screenWidth < 1000) return 5;
  return 6;
}

function tick(e) {
  var colorMax = getColorMax();
    svg.selectAll("circle").each(gravity(.2 * e.alpha))
        .each(collide(.5))
        .attr("cx", function (d) {
        return d.x;
    })
        .attr("cy", function (d) {
        return d.y;
    });
}

// Move nodes toward cluster focus.
function gravity(alpha) {

    return function (d) {
        d.y += (d.cy - d.y) * alpha;
        d.x += (d.cx - d.x) * alpha;
    };
}

// Resolve collisions between nodes.
function collide(alpha) {
    var quadtree = d3.geom.quadtree(nodes);
    var padding = getPadding($("#bubbles").width());
    var maxColor = getColorMax();
    return function (d) {
        var r = d.radius + 1 + padding,
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
        quadtree.visit(function (quad, x1, y1, x2, y2) {
            if (quad.point && (quad.point !== d)) {
                var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.radius + quad.point.radius + (d.colorClass !== quad.point.c) * padding;
                if (l < r) {
                    l = (l - r) / l * alpha;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
    };
}

function start() {

 var circleNode = svg.selectAll("circle")
    .data(force.nodes());

circleNode
    .enter().append("circle")
    .attr("r", function (d) { return d.radius;})
    .attr("cx", function (d) { return d.cx;})
    .attr("cy", function (d) { return d.cy;})
    .style("fill", function (d) { return d.color; });

circleNode.transition().duration(200)
    .attr("r", function(d) { return d.radius; });

circleNode.exit().remove();

  force.start();
}

function resized3(){
 console.log("resize");
  width = $("#bg").width();
  height = $("#bg").height();

var containerWidth = $("#container").width();
  $("#chat-text").height(height*2/3).width(containerWidth);
  $("#bubbles").height(height).width(width);
  $("#chat-text").css('top', height/3 +'px');
  height = height - margin.top - margin.bottom;
  width = width - margin.left - margin.right;
  
  $("svg").width(width).height(height);
  x = d3.scale.linear().domain([0,width]).range([0,width]),
  y = d3.scale.linear().domain([0,height]).range([0,height/3]);

 var rad = getRadius(width);
 // console.log("radius will be " + rad);
  var nodes = force.nodes();
  for (var i in nodes){
     nodes[i].cx = x(width/2);
     nodes[i].cy = y((height/3)/2);
     nodes[i].radius = rad;
  }
  force.nodes(nodes);

    // resize the chart
    // d3.select(svg.node().parentNode)
    //     .style('height', (y.rangeExtent()[1] + margin.top + margin.bottom) + 'px')
    //     .style('width', (width + margin.left + margin.right) + 'px');
  start();
}
window.onresize = function(event){

}
//receiving a message
//get data and show in chat box
inbox.onmessage = function(message) {
  // console.log(message);
  var data = JSON.parse(message.data);
  var name = data.handle;
  var content = data.text;
  var textLength = parseInt(data.length);
  // console.log(textLength);
 
  var negP = parseFloat(data.neg);
  // console.log(data.neg);
  var posP = parseFloat(data.pos);
  // console.log(posP);

  var emotionRangeClassString = ""
    if ( negP > posP){

      switch(negP){
        case 1:
          emotionRangeClassString = "rg-5";
          break;
        case 2:
          emotionRangeClassString = "rg-4";
          break;
        case 3:
          emotionRangeClassString = "rg-3";
          break;
        case 4:
          emotionRangeClassString = "rg-2";
          break;
        case 5:
          emotionRangeClassString = "rg-1";
          break;
      }
    }
    else if(posP > negP){
      var index = posP + 6;
      emotionRangeClassString = "rg-".concat( index.toString() ); 
    }
    else{ 
      emotionRangeClassString = "rg-6";
    }

  // console.log(emotionRangeClassString);

  var bubblesNb = data.length;
  //if it's the content we entered
  var cl = 'his-words';
  if ( $("#input-name")[0].value == name ) {
    cl = 'my-words';
  }
  $("#chat-text").append("<div class='bubble-span-panel'><div class='speechbubble "+cl+" "+ 
      emotionRangeClassString+"'" + "><div class='panel-body white-text'>" + 
      $('<span/>').text(data.text).html() + "</div></div></div>");
  
  $("#chat-text").stop().animate({
    scrollTop: $('#chat-text')[0].scrollHeight
    }, 800,function(){
    addNodes(data.text, bubblesNb,data.pos,data.neg,emotionRangeClassString);
    start();
  });

};

function getLastMessage(){
  var last = $( "#chat-text" );
  last = last.children().last();
  last = last.children().last();
  return last;
}
function addNodes(msg, bubblesNb, pos, neg, emotionRangeClassString){
  var last = getLastMessage();
  var offset = last.position();
  var offset2 = last.offset();
 
  var rect = {
    offsetLeft: last.position().left, 
    offsetTop:(last.position().top + $("#bg").height()/3),  
    width: last.width(), 
    height: last.height()
  };
  // console.log(offset);
  var width = $("#bubbles").width();
  var rad = getRadius(width);
  // console.log("radius: " + rad);
  colors[emotionRangeClassString] += parseInt(bubblesNb);
  var colorMax = getColorMax();
  // console.log("color max is " + colorMax);
  var r = getRadiusFromCenter(x(width/2),y(height/2), colorMax);
  for (var i in nodes){
    var node = nodes[i];
    if (node.colorClass === colorMax){
       var rand = Math.random();
       var angle = rand*Math.PI*2;
       node.cx = x(width/2) + Math.cos(angle)*r ;
       node.cy = y(height/2) + Math.sin(angle)*r ;
    }else{
       node.cx = x(width/2);
       node.cy = y(height/2);
    }
  }
  // force.nodes(nodes);
	for (var i = 0 ; i < bubblesNb; i++){
    var rand = Math.random();
    var angle = rand*Math.PI*2;
    var xC ,yC;
    var startCoord = randomPointInRect(rect);
    if (colorMax === emotionRangeClassString){
       xC = x(width/2) + Math.cos(angle)*r ;
       yC = y(height/2) + Math.sin(angle)*r ;
    }else{
       xC = x(width/2);
       yC = y(height/2);
    }
    
		nodes.push({
  		id : Math.floor(rand*1000000000),
  		radius: rad,
      colorClass: emotionRangeClassString,
  		color: color(emotionRangeClassString),
      weight : Math.floor(Math.random()*100),
  		cx: xC,
  		cy: yC,
      x:startCoord.x,
      y:startCoord.y,
      angle: angle,
	  });
	}
  printColors();

}

function randomPointInRect(rect){
  var x,y,
    perc = Math.floor(Math.random()*100),
    onLeftSide = Math.floor(Math.random()*2) ===1 ? true: false;
  if (onLeftSide){
     y = rect.offsetTop + perc*rect.height/100;
     x = rect.offsetLeft;
  } else {
     y = rect.offsetTop;
     x = rect.offsetLeft+ perc*rect.width/100;
  }
  return {x:x,y:y};
}

function printColors(){
  for (var i in color.domain()){
    console.log(color.domain()[i] + " - " + colors[color.domain()[i]]);
  }
}

function getColorMax(){
  var max ='';
  for (var i in color.domain()){
    if (max ===''){
      max = color.domain()[i];
    }else{
      if (colors[color.domain()[i]] > colors[max]){
        max = color.domain()[i];
      }
    }
  }
  return max;
}

inbox.onclose = function(){
    console.log('inbox closed');
    this.inbox = new WebSocket(inbox.url);

};

outbox.onclose = function(){
    console.log('outbox closed');
    this.outbox = new WebSocket(outbox.url);
};


//send message to server when submit button pressed.
$("#input-form").on("submit", function(event) {

  if ( $("#input-name").val() == ""){
    alert("Type your name!!");
    return
  }
  event.preventDefault();
  var handle = $("#input-name")[0].value;
  var text   = $("#input-text")[0].value;

  //we stringify it because it only support string.
  outbox.send(JSON.stringify({ handle: handle, text: text }));
  $("#input-text")[0].value = "";
  //console.log(stringifyText);
});

function textEntered(){
 if ( $("#input-name").val() == ""){
    alert("Type your name!!");
    return
  }

  var handle = $("#input-name")[0].value;
  var text   = $("#input-text")[0].value;

  //we stringify it because it only support string.
  outbox.send(JSON.stringify({ handle: handle, text: text }));
  $("#input-text")[0].value = "";
  //console.log(stringifyText);
}
//called when confirm button pressed,
//change the input
//change the button
function nameConfirm(){

    if(!$("#input-name").prop('readonly')) {
        $("#input-name").prop('readonly', true);
        $("#name-confirm-btn").html("Reset");    
    }
    else{
        $("#input-name").prop('readonly', false);
        $("#name-confirm-btn").html("Confirm");
    }
    
}

$( window ).load(function() {
 resized3();
});