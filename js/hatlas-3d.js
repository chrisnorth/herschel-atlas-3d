function HATLASPlot(){
    return this;
}

HATLASPlot.prototype.rdz2xy = function (RAscl,Decscl,z) {
    //convert from RA,DEC,z to isometric projects
    // from https://en.wikipedia.org/wiki/Isometric_projection
    x = Math.sqrt(1/2) * (RAscl - z)
    y = Math.sqrt(1/6) * (RAscl + Decscl + z)
    return [x,y];
};
HATLASPlot.prototype.scaleData = function(d){
    //scale data
    d.RAscl=0.5*(d.RA-this.dCtr.RA)/this.dRng.RA;
    d.Decscl=(d.Dec-this.dCtr.Dec)/this.dRng.Dec;
    d.zscl=-2*(d.z-this.dCtr.z)/this.dRng.z;
    d.tscl=-2*(d.t-this.dCtr.t)/this.dRng.t;
}
HATLASPlot.prototype.drawGraphInit = function(){
    // console.log('reading data')
    var ha=this;


    d3.csv("data/HATLAS_time_core.csv", function(error, data){
        // console.log('data read')
        ha.dataAll = data
        ha.dataAll.forEach(function(d){
            d.RA=+d.RA;
            d.Dec=+d.Dec;
            d.z=+d.z;
            d.t=+d.LookbackTime;
        })
        // console.log('formatted');
        //calculate ranges
        ha.dMin={'t':0.0,'z':0};
        ha.dMax={};
        ha.dRng={};
        ha.dCtr={};
        // ha.forceMin={t:0}
        var axes=['RA','Dec','z','t']
        for (var a=0;a<axes.length;a++){
            ax=axes[a];
            // console.log(a,ax);
            if (ha.dMin[ax]==null){ha.dMin[ax]=d3.min(ha.dataAll,function(d){return d[ax]});}
            if (ha.dMax[ax]==null){ha.dMax[ax]=d3.max(ha.dataAll,function(d){return d[ax]});}
            ha.dRng[ax]=ha.dMax[ax] - ha.dMin[ax];
            ha.dCtr[ax]=ha.dMin[ax] + ha.dRng[ax]/2;
        }
        ha.dataAll.forEach(function(d){
            ha.scaleData(d);
            [d.x,d.y]=ha.rdz2xy(d.RAscl,d.Decscl,d.tscl);
        })
        //calculate danges for
        for (var a=0;a<axes.length;a++){
            ax=axes[a]+'scl';
            // console.log(a,ax);
            ha.dMin[ax]=d3.min(ha.dataAll,function(d){return d[ax]});
            ha.dMax[ax]=d3.max(ha.dataAll,function(d){return d[ax]});
            ha.dRng[ax]=ha.dMax[ax] - ha.dMin[ax];
            ha.dCtr[ax]=ha.dMin[ax] + ha.dRng[ax]/2;
        }
        // console.log(x,y);
        var xy=['x','y']
        for (var a=0;a<xy.length;a++){
            ax=xy[a];
            ha.dMin[ax]=d3.min(ha.dataAll,function(d){return d[ax]});;
            ha.dMax[ax]=d3.max(ha.dataAll,function(d){return d[ax]});
            ha.dRng[ax]=ha.dMax[ax] - ha.dMin[ax];
            ha.dCtr[ax]=ha.dMin[ax] + ha.dRng[ax]/2;
        }
        // ha.dMin = {
        //     RA:d3.min(ha.dataAll,function(d){return d.RA}),
        //     Dec:d3.min(ha.dataAll,function(d){return d.Dec}),
        //     Z:d3.min(ha.dataAll,function(d){return d.z}),
        // }
        // ha.dMax = {
        //     RA:d3.max(ha.dataAll,function(d){return d.RA}),
        //     Dec:d3.max(ha.dataAll,function(d){return d.Dec}),
        //     Z:d3.max(ha.dataAll,function(d){return d.z})
        // }
        // ha.dataCtr = {
        //     RA: 0.5*(ha.dataRange.RAmin + ha.dataRange.RAmin)
        // }
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

    // data -> value
    this.xValue = function(d) {return d.x;}
    // value -> display
    this.xScale = d3.scale.linear()
        .domain([this.dMin.x-0.1,this.dMax.x+0.1])
        .range([0, this.svgWidth])
    // data -> display
    this.xMap = function(d) { return ha.xScale(ha.xValue(d));}

    // data -> value
    this.yValue = function(d) {return d.y;}
    // value -> display
    this.yScale = d3.scale.linear()
        .domain([this.dMin.y-0.1,this.dMax.y+0.1])
        .range([0, this.svgHeight])
    // data -> display
    this.yMap = function(d) { return ha.yScale(ha.yValue(d));}
}

HATLASPlot.prototype.filterZ = function(z1In,z2In,ax){
    if (ax==null){ax="z"}
    var z1 = (z1In) ? z1In : 0
    var z2 = (z2In) ? z2In : 0.01
    console.log(this.dataAll,z2);
    return this.dataAll.filter(function(d){
        return ((d[ax]<=z2)&&(d[ax]>z1));
    })
}
HATLASPlot.prototype.makePlot = function(){
    var ha=this;
    // this.color=d3.scale.category20();
    // this.cValue = function(d) {return d.t;};
    this.color = d3.scale.linear()
         .domain([ha.dMin.t,ha.dMax.t])
         .range(["#000000","#ff0000"]);
    this.cValue = function(d) {return d.t;};
    this.dotsize=1;
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
    this.dataFilt = this.filterZ(ha.dMin.t,ha.dMax.t,'t');
    // this.dataFilt = this.dataAll;
    // console.log(this.dataFilt);
    this.svg.selectAll(".dot")
        .data(this.dataFilt)
        .enter()
        .append("circle")
        .attr("r",this.dotsize)
        .attr("cx",ha.xMap)
        .attr("cy",ha.yMap)
        .style("fill", function(d){return ha.color(ha.cValue(d));})
        .attr("opacity",0.5);
    // top line
    var corners={
        x0y0z0:ha.rdz2xy(ha.dMin.RAscl,ha.dMin.Decscl,ha.dMin.tscl),
        x1y0z0:ha.rdz2xy(ha.dMax.RAscl,ha.dMin.Decscl,ha.dMin.tscl),
        x0y1z0:ha.rdz2xy(ha.dMin.RAscl,ha.dMax.Decscl,ha.dMin.tscl),
        x0y0z1:ha.rdz2xy(ha.dMin.RAscl,ha.dMin.Decscl,ha.dMax.tscl),
        x1y1z0:ha.rdz2xy(ha.dMax.RAscl,ha.dMax.Decscl,ha.dMin.tscl),
        x0y1z1:ha.rdz2xy(ha.dMin.RAscl,ha.dMax.Decscl,ha.dMax.tscl),
        x1y0z1:ha.rdz2xy(ha.dMax.RAscl,ha.dMin.Decscl,ha.dMax.tscl),
        x1y1z1:ha.rdz2xy(ha.dMax.RAscl,ha.dMax.Decscl,ha.dMax.tscl)
    };
    ax=['x','y','z'];
    var lines={
        x0y0:['x0y0z0','x0y0z1'],
        x0y1:['x0y1z0','x0y1z1'],
        x1y0:['x1y0z0','x1y0z1'],
        x1y1:['x1y1z0','x1y1z1'],
        x0z0:['x0y0z0','x0y1z0'],
        x0z1:['x0y0z1','x0y1z1'],
        x1z0:['x1y0z0','x1y1z0'],
        x1z1:['x1y0z1','x1y1z1'],
        y0z0:['x0y0z0','x1y0z0'],
        y1z0:['x0y1z0','x1y1z0'],
        y0z1:['x0y0z1','x1y0z1'],
        y1z1:['x0y1z1','x1y1z1']
    }
    for (l in lines){
        // console.log(l,lines[l][0],corners[lines[l][0]],corners[lines[l][0]][0],ha.xScale(corners[lines[l][0]][0]));
        this.svg.append("line")
            .attr("x1",ha.xScale(corners[lines[l][0]][0]))
            .attr("x2",ha.xScale(corners[lines[l][1]][0]))
            .attr("y1",ha.yScale(corners[lines[l][0]][1]))
            .attr("y2",ha.yScale(corners[lines[l][1]][1]))
            .style("stroke","black");
    }
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
