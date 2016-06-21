function HATLASPlot(){
    return this;
}

HATLASPlot.prototype.drawGraphInit = function(){
    console.log('reading data')
    var ha=this;

    this.ang=10*Math.PI/180;


    d3.csv("data/HATLAS_time_core.csv", function(error, data){
        console.log('data read')
        ha.dataAll = data
        ha.dataAll.forEach(function(d){
            d.RA=+d.RA;
            d.Dec=+d.Dec;
            d.z=+d.z;
        })
        console.log('formatted');
        //calculate ranges
        ha.dataRange = {
            RAmin:d3.min(ha.dataAll,function(d){return d.RA}),
            RAmax:d3.max(ha.dataAll,function(d){return d.RA}),
            Decmin:d3.min(ha.dataAll,function(d){return d.Dec}),
            Decmax:d3.max(ha.dataAll,function(d){return d.Dec}),
            Zmin:d3.min(ha.dataAll,function(d){return d.z}),
            Zmax:d3.max(ha.dataAll,function(d){return d.z})
        }
        console.log(this.dataRange);
        ha.scaleWindow();
        ha.makePlot()
    });
}

HATLASPlot.prototype.scaleWindow = function(){
    var ha=this;
    this.winFullWidth=document.getElementById("full").offsetWidth;
    this.winFullHeight=document.getElementById("full").offsetHeight;
    this.winAspect = this.winFullWidth/this.winFullHeight;
    this.fullGraphWidth = this.winFullWidth;
    this.fullGraphHeight = this.winFullHeight;
    this.svgSize = Math.min(this.fullGraphHeight,this.fullGraphWidth)
    this.svgHeight = this.svgSize;
    this.svgWidth = this.svgSize;
    this.margin={left:0,top:0,bottom:0,right:0}

    this.xValue = function(d) {return d.RA;} // data -> value
    // value -> display
    this.xScale = d3.scale.linear()
        .domain([this.dataRange.RAmin-0.1,this.dataRange.RAmax+0.1])
        .range([0, this.svgWidth])
        // data -> display
    this.xMap = function(d) { return ha.xScale(ha.xValue(d));}
    this.yValue = function(d) {return d.Dec;} // data -> value
    this.yScale = d3.scale.linear()
        .domain([this.dataRange.Decmin-0.1,this.dataRange.Decmax+0.1])
        .range([0, this.svgHeight])
        // data -> display
    this.yMap = function(d) { return ha.yScale(ha.yValue(d));}
}

HATLASPlot.prototype.filterZ = function(z1In,z2In){
    var z1 = (z1In) ? z1In : 0
    var z2 = (z2In) ? z2In : 0.01
    console.log(this.dataAll,z2);
    return this.dataAll.filter(function(d){
        return ((d.z<=z2)&&(d.z>z1));
    })
}

HATLASPlot.prototype.makePlot = function(){
    var ha=this;
    this.color=d3.scale.category20();
    this.cValue = function(d) {return d.z;};
    // this.color = d3.scale.linear()
    //     .domain([-7,1])
    //     .range(["red","blue"]);
    // this.cValue = function(d) {return Math.log10(d.z);};
    this.dotsize=2;
    svgcont = d3.select("div#graphcontainer").append("div")
        .attr("id","svg-container")
        .attr("width",this.svgWidth)
        .attr("height",this.svgHeight)
        .classed("svg-container",true);
    this.svg = d3.select(".svg-container").append("svg")
        .attr("width",this.svgWidth)
        .attr("height",this.svgHeight)
    this.svg.append("g")
        .attr("transform", "translate(" + this.margin.left + "," +
            this.margin.top + ")")
    this.dataFilt = this.filterZ();
    this.dataFilt = this.dataAll;
    console.log(this.dataFilt);
    this.svg.selectAll(".dot")
        .data(this.dataFilt)
        .enter()
        .append("circle")
        .attr("r",this.dotsize)
        .attr("cx",ha.xMap)
        .attr("cy",ha.yMap)
        .style("fill", function(d){return ha.color(ha.cValue(d));});
    // top line
    this.svg.append("line")
        .attr("x1",0).attr("x2",ha.svgWidth)
        .attr("y1",0).attr("y2",0)
        .style("stroke","rgb(200,200,200)").attr("stroke-width",5)
    // bottom line
    this.svg.append("line")
        .attr("x1",0).attr("x2",ha.svgWidth)
        .attr("y1",ha.svgHeight).attr("y2",ha.svgHeight)
        .style("stroke","rgb(200,200,200)").attr("stroke-width",5)
    // left line
    this.svg.append("line")
        .attr("x1",0).attr("x2",0)
        .attr("y1",0).attr("y2",ha.svgHeight)
        .style("stroke","rgb(200,200,200)").attr("stroke-width",5)
    // right line
    this.svg.append("line")
        .attr("x1",ha.svgWidth).attr("x2",ha.svgWidth)
        .attr("y1",0).attr("y2",ha.svgHeight)
        .style("stroke","rgb(200,200,200)").attr("stroke-width",5)
}

hap = new HATLASPlot();

// hap.scaleWindow()
hap.drawGraphInit()
