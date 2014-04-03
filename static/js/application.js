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
    padding = 6,
    radius = d3.scale.sqrt().range([0, 4]),
    color = d3.scale.ordinal().domain(['rg-1','rg-2','rg-3','rg-4','rg-5','rg-6','rg-7','rg-8','rg-9','rg-10','rg-11']).range(['black','red','#919191','#660000','#f8651d','#6240a1','#f9659b','#fbfe32','#3302fb','#30cf31','white']),
    x = d3.scale.linear().domain([0,width]).range([0,width]),
    y = d3.scale.linear().domain([0,height]).range([0,height]);
var nodes = [];
/*
var nodes = d3.range(n).map(function () {
    var i = Math.floor(Math.random() * m), //color
        v = (i + 1) / m * -Math.log(Math.random()); //value
    var n = {
	id : Math.floor(Math.random()*1000000000),
        radius: radius(v),
        color: color(i),
        cx: x(i),
        cy: height / 2,
    };
return n;

});
*/

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
function tick(e) {
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
    return function (d) {
        var r = d.radius + radius.domain()[1] + padding,
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
        quadtree.visit(function (quad, x1, y1, x2, y2) {
            if (quad.point && (quad.point !== d)) {
                var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.radius + quad.point.radius + (d.color !== quad.point.color) * padding;
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
    .style("fill", function (d) { return d.color; })
    .call(force.drag);

// circleNode.transition().duration(200)
// .attr("cx", function(d) { return d.cx; })
//     .attr("cy", function(d) { return d.cy; });

circleNode.exit().remove();

  force.start();
}

function resized3(){
  width = $("#bg").width();
  height = $("#bg").height();

  $("#chat-text").height(height*2/3).width(width);
  $("#bubbles").height(height/3).width(width);
  $("#chat-text").css('top', height/3 +'px');
  height = height/3 - margin.top - margin.bottom;
  width = width - margin.left - margin.right;
  
  $("svg").width(width);

  x = d3.scale.linear().domain([0,width]).range([0,width]),
    y = d3.scale.linear().domain([0,height]).range([0,height]);
    var nodes = force.nodes();
    for (var i in nodes){
     nodes[i].cx = x(width/2);
     nodes[i].cy = y(height/2);
    }
    force.nodes(nodes);

    // resize the chart
    // d3.select(svg.node().parentNode)
    //     .style('height', (y.rangeExtent()[1] + margin.top + margin.bottom) + 'px')
    //     .style('width', (width + margin.left + margin.right) + 'px');
  start();
}
window.onresize = function(event){
  console.log(event);
  console.log( $("#chat-text").height());
  console.log( $("#chat-text").width());
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
  if ( $("#input-name")[0].value == name ) {
    
    $("#chat-text").append("<div class='bubble-span-panel'><div class='words my-words "+emotionRangeClassString+"'" + "><div class='panel-body white-text'>" + $('<span/>').text(data.text + "  --> # of bubbles = " + bubblesNb + ", value of neg = " + data.neg + ", value of pos = " + data.pos ).html() + "</div></div></div>"); 
  }
  //if it's the content other people entered
  else{

     $("#chat-text").append("<div class='bubble-span-panel'><div class='words his-words "+emotionRangeClassString+"'" + "><div class='panel-body white-text'>" + $('<span/>').text(data.text + "  --> # of bubbles = " + bubblesNb + ", value of neg = " + data.neg + ", value of pos = " + data.pos ).html() + "</div></div></div>");

  }

  addNodes(data.text, bubblesNb,data.pos,data.neg,emotionRangeClassString);
	start();
  $("#chat-text").stop().animate({
    scrollTop: $('#chat-text')[0].scrollHeight
  }, 800);

};

function addNodes(msg, bubblesNb, pos, neg, emotionRangeClassString){
  var last = $( "#chat-text" );
  last = last.children().last();
  last = last.children().last();
  var offset = last.position();
  console.log(offset);
	for (var i = 0 ;i<bubblesNb;i++){
		nodes.push({
		id : Math.floor(Math.random()*1000000000),
		radius: radius(3),
		color: color(emotionRangeClassString),
    // x: offset.left,
    // y: offset.top,
		cx: x(width/2),
		cy: y(height/2),
	    });
	}
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
 console.log( $("#chat-text").height());
 console.log( $("#chat-text").width());
 // $("#bubbles").height($("#chat-text").height()).width($("#chat-text").width());
 resized3();
});