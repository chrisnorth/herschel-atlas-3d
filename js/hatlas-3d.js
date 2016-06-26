function HATLASPlot(){
    return this;
}

HATLASPlot.prototype.rdz2xy3d = function (RAscl,Decscl,z) {
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
HATLASPlot.prototype.scaleRA = function(RA){
    //scale data
    return 0.5*(RA-this.dCtr.RA)/this.dRng.RA;
}
HATLASPlot.prototype.scaleDec = function(Dec){
    return 0.5*(Dec-this.dCtr.Dec)/this.dRng.Dec;
}
HATLASPlot.prototype.scaleZ = function(z){
    return -2*(z-this.dCtr.z)/this.dRng.z;
}
HATLASPlot.prototype.scaleT = function(t){
    return -2*(t-this.dCtr.t)/this.dRng.t;
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
            d.RAscl = ha.scaleRA(d.RA);
            d.Decscl = ha.scaleDec(d.Dec);
            d.zscl = ha.scaleZ(d.z);
            d.tscl = ha.scaleT(d.t);
            //ha.scaleData(d);
            [d.x,d.y]=ha.rdz2xy3d(d.RAscl,d.Decscl,d.tscl);
        })
        //calculate ranges for
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
        //get data for high-z
        if (ha.dMax.z > 2.0){
            ha.zBgMin = 2.0
        }else{
            ha.zBgMin = ha.dMax.z;
        }
        ha.dataHiZ = ha.dataAll.filter(function(d){return (d.z > ha.zBgMin);});
        console.log(ha.zBgMin,ha.dataHiZ);
        //
        ha.scaleWindow();
        ha.make3dPlot();
        ha.make2dPlot();
        ha.addButtons();
        ha.addNumbers();
    });
}

HATLASPlot.prototype.scaleWindow = function(){
    var ha=this;
    this.winFullWidth=document.getElementById("full").offsetWidth;
    this.winFullHeight=document.getElementById("full").offsetHeight;
    this.winAspect = this.winFullWidth/this.winFullHeight;
    this.fullGraphWidth = this.winFullWidth;
    this.fullGraphHeight = this.winFullHeight;
    this.svg3dSize = Math.min(this.fullGraphHeight,this.fullGraphWidth/2.)
    this.margin3d={left:0,top:0,bottom:0,right:0};
    this.margin2d={left:60,top:20,bottom:60,right:20}
    this.svg3dHeight = this.svg3dSize;
    this.svg3dWidth = this.svg3dSize;
    this.svg3dPlotHeight = this.svg3dHeight - this.margin3d.top - this.margin3d.bottom;
    this.svg3dPlotWidth = this.svg3dWidth - this.margin3d.left - this.margin3d.right;

    this.svg2dSize = Math.min(0.9*this.fullGraphHeight,0.9*this.fullGraphWidth/2.)
    this.svg2dHeight = this.svg2dSize;
    this.svg2dWidth = this.svg2dSize;
    this.svg2dPlotHeight = this.svg2dHeight - this.margin2d.top - this.margin2d.bottom;
    this.svg2dPlotWidth = this.svg2dWidth - this.margin2d.left - this.margin2d.right;

    // data -> display
    this.xValue3d = function(d) {return d.x;}
    this.xScale3d = d3.scale.linear()
        .domain([this.dMin.x-0.1,this.dMax.x+0.1])
        .range([0, this.svg3dWidth])
    this.xMap3d = function(d) { return ha.xScale3d(ha.xValue3d(d));}

    // data -> display
    this.yValue3d = function(d) {return d.y;}
    this.yScale3d = d3.scale.linear()
        .domain([this.dMin.y-0.1,this.dMax.y+0.1])
        .range([0, this.svg3dHeight])
    this.yMap3d = function(d) { return ha.yScale3d(ha.yValue3d(d));}

    // data -> display
    this.xValue2d = function(d) {return d.RA;}
    this.xScale2d = d3.scale.linear()
        .domain([this.dMin.RA-0.1,this.dMax.RA+0.1])
        .range([0, this.svg2dPlotWidth])
    this.xMap2d = function(d) { return ha.xScale2d(ha.xValue2d(d));}

    // data -> display
    this.yValue2d = function(d) {return d.Dec;}
    this.yScale2d = d3.scale.linear()
        .domain([this.dMin.Dec-0.1,this.dMax.Dec+0.1])
        .range([0, this.svg2dPlotHeight])
    this.yMap2d = function(d) { return ha.yScale2d(ha.yValue2d(d));}
}

HATLASPlot.prototype.filterZ = function(ax1In,ax2In,axName){
    if (axName==null){axName="z"}
    var ha=this;
    var ax1 = (ax1In) ? ax1In : 0;
    var ax2 = (ax2In) ? ax2In : 0.01;
    this.dataAll.forEach(function(d){
        if((d[axName]<=ax2)&&(d[axName]>ax1)){
            //in slice
            d.inSlice = 1;
        }else if((d[axName]<=ax2+ha.tRng2d)&&(d[axName]>ax1-ha.tRng2d)){
            //either side of slice
            d.inSlice=0.5;
        }else{
            //nowhere near slice
            d.inSlice=0;
        }
    });
    //get z limits
    dataFilt=this.dataAll.filter(function(d){return (d.inSlice==1);});
    this.zMin2d = d3.min(dataFilt,function(d){return d.z});
    this.zMax2d = d3.max(dataFilt,function(d){return d.z});
    return dataFilt;
}
HATLASPlot.prototype.getRAAxisAngle = function(){
    xy0=this.rdz2xy3d(this.dMin.RAscl,this.dMin.Decscl,this.dMin.tscl)
    xy1=this.rdz2xy3d(this.dMax.RAscl,this.dMin.Decscl,this.dMin.tscl)
    ang=(180./Math.PI)*Math.atan2((xy1[0]-xy0[0]),(xy1[1]-xy0[1]))
    return ang;
}
HATLASPlot.prototype.getRAAxisLength = function(){
    xy0=this.rdz2xy3d(this.dMin.RAscl,this.dMin.Decscl,this.dMin.tscl)
    xy1=this.rdz2xy3d(this.dMax.RAscl,this.dMin.Decscl,this.dMin.tscl)
    length=Math.sqrt((xy1[0]-xy0[0])*(xy1[0]-xy0[0]) + (xy1[1]-xy0[1])*(xy1[1]-xy0[1]))
    return length;
}
HATLASPlot.prototype.getDecAxisAngle = function(){
    xy0=this.rdz2xy3d(this.dMin.RAscl,this.dMin.Decscl,this.dMin.tscl)
    xy1=this.rdz2xy3d(this.dMin.RAscl,this.dMax.Decscl,this.dMin.tscl)
    ang=(180./Math.PI)*Math.atan2((xy1[1]-xy0[1]),(xy1[0]-xy0[0]))
    return ang;
}
HATLASPlot.prototype.getDecAxisLength = function(){
    xy0=this.rdz2xy3d(this.dMin.RAscl,this.dMin.Decscl,this.dMin.tscl)
    xy1=this.rdz2xy3d(this.dMin.RAscl,this.dMax.Decscl,this.dMin.tscl)
    length=Math.sqrt((xy1[0]-xy0[0])*(xy1[0]-xy0[0]) + (xy1[1]-xy0[1])*(xy1[1]-xy0[1]))
    return length;
}
HATLASPlot.prototype.getZAxisAngle = function(){
    // xy0=this.xScale3d(this.rdz2xy3d(this.dMin.RAscl,this.dMin.Decscl,this.dMin.tscl))
    // xy1=this.xScale3d(this.rdz2xy3d(this.dMin.RAscl,this.dMin.Decscl,this.dMax.tscl))
    // ang=(180./Math.PI)*Math.atan2((xy1[1]-xy0[1]),(xy1[0]-xy0[0]))
    x0=this.xScale3d(this.rdz2xy3d(this.dMin.RAscl,this.dMin.Decscl,this.dMin.tscl)[0])
    x1=this.xScale3d(this.rdz2xy3d(this.dMin.RAscl,this.dMin.Decscl,this.dMax.tscl)[0])
    y0=this.yScale3d(this.rdz2xy3d(this.dMin.RAscl,this.dMin.Decscl,this.dMin.tscl)[1])
    y1=this.yScale3d(this.rdz2xy3d(this.dMin.RAscl,this.dMin.Decscl,this.dMax.tscl)[1])
    ang=(180./Math.PI)*Math.atan2((y1-y0),(x1-x0)) + 90.
    return ang;
}
HATLASPlot.prototype.getZAxisLength = function(){
    x0=this.xScale3d(this.rdz2xy3d(this.dMin.RAscl,this.dMin.Decscl,this.dMin.tscl)[0])
    x1=this.xScale3d(this.rdz2xy3d(this.dMin.RAscl,this.dMin.Decscl,this.dMax.tscl)[0])
    y0=this.yScale3d(this.rdz2xy3d(this.dMin.RAscl,this.dMin.Decscl,this.dMin.tscl)[1])
    y1=this.yScale3d(this.rdz2xy3d(this.dMin.RAscl,this.dMin.Decscl,this.dMax.tscl)[1])
    length=Math.sqrt((y1-y0)*(y1-y0) + (x1-x0)*(x1-x0))
    return length;
}
HATLASPlot.prototype.get3dOpacity = function(d) {
    if(d.inSlice==1){return 1;}else{return 0.1;};
}
HATLASPlot.prototype.get2dOpacity = function(d) {
    if(d.inSlice==1){return 1;}
    else if (d.inSlice==0.5){return 0.25;};
}
HATLASPlot.prototype.get2dOpacityHiZ = function(d) {
    return 0.25;
}
HATLASPlot.prototype.getAstroScales = function(){
    var ha=this;
    // RA/Dec/z -> display
    this.RAValue3d = function(d) {return d.RA;}
    this.RAScale3d = d3.scale.linear()
        .domain([this.dMin.RA,this.dMax.RA])
        .range([0, this.getRAAxisLength()])
    this.RAMap3d = function(d) { return ha.RAScale3d(ha.RAValue3d(d));}
    //
    this.DecValue3d = function(d) {return d.Dec;}
    this.DecScale3d = d3.scale.linear()
        .domain([this.dMin.Dec,this.dMax.Dec])
        .range([0, this.getDecAxisLength()])
    this.DecMap3d = function(d) { return ha.DecScale3d(ha.DecValue3d(d));}
    //
    this.ZValue3d = function(d) {return d.z;}
    this.ZScale3d = d3.scale.linear()
        .domain([this.dMin.z,this.dMax.z])
        .range([0, this.getZAxisLength()])
    this.ZMap3d = function(d) { return ha.ZScale3d(ha.ZValue3d(d));}
}

HATLASPlot.prototype.make3dPlot = function(){
    var ha=this;
    // this.color=d3.scale.category20();
    // this.cValue = function(d) {return d.t;};
    this.color3d = d3.scale.linear()
         .domain([ha.dMin.t,ha.dMax.t])
         .range(["#000000","#ff0000"]);
    this.cValue3d = function(d) {return d.t;};
    this.dotsize3d=1;
    this.svg3dCont = d3.select("div#svg-container-3d")
    this.svg3dCont
        .style("width",this.svg3dWidth)
        .style("height",this.svg3dHeight);
    this.svg3d = this.svg3dCont.append("svg")
        .style("width",this.svg3dWidth)
        .style("height",this.svg3dHeight)

    // set axis functions
    this.getAstroScales();
    this.RAAxis3d = d3.svg.axis()
            .scale(this.xScale3d)
            .orient("bottom")
            .innerTickSize(-ha.svg3dPlotHeight)
            .outerTickSize(1);
    this.DecAxis3d = d3.svg.axis()
            .scale(this.yScale3d)
            .orient("left")
            .innerTickSize(-ha.svg3dPlotHeight)
            .outerTickSize(1);
    this.ZAxis3d = d3.svg.axis()
            .scale(ha.ZScale3d)
            .orient("left")
            .innerTickSize([5])
            .outerTickSize(0);

    this.svg3d.append("g")
        .attr("class", "z-axis axis")
        .attr("transform", "translate("+
            this.xScale3d(this.rdz2xy3d(this.dMax.RAscl,this.dMax.Decscl,this.dMax.tscl)[0])+"," +
            (this.yScale3d(this.rdz2xy3d(this.dMax.RAscl,this.dMax.Decscl,this.dMax.tscl)[1])) +
             ") rotate("+(this.getZAxisAngle())+")");
            //  ") rotate("+(-90)+")");
    this.svg3d.select(".z-axis.axis").call(this.ZAxis3d)
    this.svg3d.selectAll(".z-axis.axis .tick text")
        .attr("transform","rotate("+(-this.getZAxisAngle())+")")
        .attr("dy",15)
        .attr("dx",20);
    this.svg3d.select(".z-axis.axis").append("text")
        .attr("transform","rotate("+(90)+")")
        .attr("class", "z-axis axis-label")
        .attr("x", this.getZAxisLength()/2)
        .attr("y",0)
        .attr("dy", "40px")
        .style("text-anchor", "middle")
        .text("Lookback Time (billion years)");

    //
    this.g3d = this.svg3d.append("g")
        .attr("transform", "translate(" + this.margin3d.left + "," +
            this.margin3d.top + ")")
    // this.dataFilt = this.dataAll;
    // console.log(this.dataFilt);

    // filter data
    // this.dataFilt3d = this.filterZ(ha.dMin.t,ha.dMax.t,'t');
    // add dots
    this.g3d.selectAll(".dot")
        .data(this.dataAll)
        .enter()
        .append("circle")
        .attr("class","dot")
        .attr("r",this.dotsize3d)
        .attr("cx",ha.xMap3d)
        .attr("cy",ha.yMap3d)
        .style("fill", function(d){return ha.color3d(ha.cValue3d(d));});
    // top line
    var corners={
        x0y0z0:ha.rdz2xy3d(ha.dMin.RAscl,ha.dMin.Decscl,ha.dMin.tscl),
        x1y0z0:ha.rdz2xy3d(ha.dMax.RAscl,ha.dMin.Decscl,ha.dMin.tscl),
        x0y1z0:ha.rdz2xy3d(ha.dMin.RAscl,ha.dMax.Decscl,ha.dMin.tscl),
        x0y0z1:ha.rdz2xy3d(ha.dMin.RAscl,ha.dMin.Decscl,ha.dMax.tscl),
        x1y1z0:ha.rdz2xy3d(ha.dMax.RAscl,ha.dMax.Decscl,ha.dMin.tscl),
        x0y1z1:ha.rdz2xy3d(ha.dMin.RAscl,ha.dMax.Decscl,ha.dMax.tscl),
        x1y0z1:ha.rdz2xy3d(ha.dMax.RAscl,ha.dMin.Decscl,ha.dMax.tscl),
        x1y1z1:ha.rdz2xy3d(ha.dMax.RAscl,ha.dMax.Decscl,ha.dMax.tscl)
    };
    this.add3dBox(corners,"3dbox");
}
HATLASPlot.prototype.add3dBox = function(corners,className){
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
    // this.
    for (l in lines){
        // console.log(l,lines[l][0],corners[lines[l][0]],corners[lines[l][0]][0],ha.xScale3d(corners[lines[l][0]][0]));
        line = this.svg3d.append("line")
            .attr("x1",this.xScale3d(corners[lines[l][0]][0]))
            .attr("x2",this.xScale3d(corners[lines[l][1]][0]))
            .attr("y1",this.yScale3d(corners[lines[l][0]][1]))
            .attr("y2",this.yScale3d(corners[lines[l][1]][1]))
            .style("stroke","black");
        if (className){line.attr("class",className)}
    }
}
HATLASPlot.prototype.make2dPlot = function(){
    var ha=this;
    //add SVG
    this.svg2dCont = d3.select("#svg-container-2d");
    this.svg2dCont
        .style("width",this.svg2dSize)
        .style("height",this.svg2dSize);
    this.svg2d = this.svg2dCont.append("svg")
        .style("width",this.svg2dWidth)
        .style("height",this.svg2dHeight)
    //define axis function
    this.RAAxis2d = d3.svg.axis()
            .scale(this.xScale2d)
            .orient("bottom")
            .innerTickSize(-10)
            .outerTickSize(0);
    this.DecAxis2d = d3.svg.axis()
            .scale(this.yScale2d)
            .orient("left")
            .innerTickSize(-10)
            .outerTickSize(0);
    //add axes
    this.svg2d.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate("+this.margin2d.left+"," +
            (this.margin2d.top + this.svg2dPlotHeight) + ")");
    this.svg2d.select(".x-axis.axis").call(this.RAAxis2d)
    this.svg2d.select(".x-axis.axis").append("text")
        .attr("class", "x-axis axis-label")
        .attr("x", this.svg2dPlotHeight/2)
        .attr("y",10)
        .attr("dy", "30px")
        .style("text-anchor", "middle")
        .text("Right Ascension");

    this.svg2d.append("g")
        .attr("class", "y-axis axis")
        .attr("transform", "translate("+this.margin2d.left+"," +
            (this.margin2d.top) + ")");
    this.svg2d.select(".y-axis.axis").call(this.DecAxis2d)
    this.svg2d.select(".y-axis.axis").append("text")
        .attr("class", "y-axis axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x",-this.svg2dPlotWidth/2)
        .attr("dy", "-30px")
        .style("text-anchor", "middle")
        .text("Declination");
    //add border
    this.svg2d.append("g")
        .attr("class", "border")
        .attr("transform", "translate("+this.margin2d.left+"," +
            (this.margin2d.top) +")");
    this.svg2d.select(".border")
        .append("line")
        .attr("x1",0).attr("x2",this.svg2dPlotWidth)
        .attr("y1",0).attr("y2",0)
        .style("stroke","rgb(0,0,0)").attr("stroke-width",2)
        .attr("opacity",1);
    this.svg2d.select(".border")
        .append("line")
        .attr("x1",0).attr("x2",this.svg2dPlotWidth)
        .attr("y1",this.svg2dPlotHeight).attr("y2",this.svg2dPlotHeight)
        .style("stroke","rgb(0,0,0)").attr("stroke-width",2)
        .attr("opacity",1);
    this.svg2d.select(".border")
        .append("line")
        .attr("x1",this.svg2dPlotWidth).attr("x2",this.svg2dPlotWidth)
        .attr("y1",0).attr("y2",this.svg2dPlotHeight)
        .style("stroke","rgb(0,0,0)").attr("stroke-width",2)
        .attr("opacity",1);
    this.svg2d.select(".border")
        .append("line")
        .attr("x1",0).attr("x2",0)
        .attr("y1",0).attr("y2",this.svg2dPlotHeight)
        .style("stroke","rgb(0,0,0)").attr("stroke-width",2)
        .attr("opacity",1);
    this.g2d = this.svg2d.append("g")
        .attr("transform", "translate(" + this.margin2d.left + "," +
            this.margin2d.top + ")")
    this.g2dHiZ = this.svg2d.append("g")
        .attr("transform", "translate(" + this.margin2d.left + "," +
            this.margin2d.top + ")")
    // Filter Data
    this.tRng2d = 0.05*ha.dRng.t;
    this.tMin2d = 0;
    this.tMax2d = this.dMin.t + this.tRng2d;
    this.dataFilt2d = this.filterZ(ha.tMin2d,ha.tMax2d,'t');

    this.color2d = d3.scale.linear()
         .domain([ha.dMin.t,ha.dMax.t])
         .range(["#000000","#ff0000"]);
    this.cValue2d = function(d) {return d.t;};
    this.dotsize2d=3;

    this.dots2d = this.g2d.selectAll(".dot")
        .data(this.dataFilt2d);
    this.dots2d
        .enter()
        .append("circle")
        .attr("class","dot")
        .attr("r",this.dotsize2d)
        .attr("cx",ha.xMap2d)
        .attr("cy",ha.yMap2d)
        .style("fill", "blue")
        .attr("opacity",function(d){return ha.get2dOpacity(d)});
    //add BG galaxies
    this.dots2dHiZ = this.g2dHiZ.selectAll(".dot")
        .data(this.dataHiZ);
    this.dots2dHiZ.enter()
        .append("circle")
        .attr("class","dot")
        .attr("r",this.dotsize2d)
        .attr("cx",ha.xMap2d)
        .attr("cy",ha.yMap2d)
        .style("fill", "red")
        .attr("opacity",function(d){return ha.get2dOpacityHiZ(d)});
    // add 2d slices
    this.slices = this.svg3d.append("g")
        .attr("transform", "translate(" + this.margin2d.left + "," +
            this.margin2d.top + ")")
    ha.addSlice();
    // this.nSliceTxt = this.svg2d.append("text")
    //     .attr("x",this.svg2dWidth)
    //     .attr("y",this.svg2dWigth)
    //     .attr("text-anchor","end")
    //     .text(this.dataFilt2d.length);
}
HATLASPlot.prototype.getSliceCorners = function(){
    return {
        x0y0z0:ha.rdz2xy3d(ha.dMin.RAscl,ha.dMin.Decscl,ha.scaleT(ha.tMin2d)),
        x1y0z0:ha.rdz2xy3d(ha.dMax.RAscl,ha.dMin.Decscl,ha.scaleT(ha.tMin2d)),
        x0y1z0:ha.rdz2xy3d(ha.dMin.RAscl,ha.dMax.Decscl,ha.scaleT(ha.tMin2d)),
        x0y0z1:ha.rdz2xy3d(ha.dMin.RAscl,ha.dMin.Decscl,ha.scaleT(ha.tMax2d)),
        x1y1z0:ha.rdz2xy3d(ha.dMax.RAscl,ha.dMax.Decscl,ha.scaleT(ha.tMin2d)),
        x0y1z1:ha.rdz2xy3d(ha.dMin.RAscl,ha.dMax.Decscl,ha.scaleT(ha.tMax2d)),
        x1y0z1:ha.rdz2xy3d(ha.dMax.RAscl,ha.dMin.Decscl,ha.scaleT(ha.tMax2d)),
        x1y1z1:ha.rdz2xy3d(ha.dMax.RAscl,ha.dMax.Decscl,ha.scaleT(ha.tMax2d))
    }
}
HATLASPlot.prototype.addSlice = function(){
    ha=this;
    // this.sliceCorners=this.getSliceCorners()
    this.add3dBox(this.getSliceCorners(),"slice-lines");
    this.g3d.selectAll(".dot")
        .data(this.dataAll)
        .attr("opacity",function(d){return ha.get3dOpacity(d)});
}
HATLASPlot.prototype.moveSlice = function(){
    this.svg3d.selectAll("line.slice-lines").remove()
    this.add3dBox(this.getSliceCorners(),"slice-lines");
    //change dot opacity within slice
    this.g3d.selectAll(".dot")
        .data(this.dataAll)
        .attr("opacity",function(d){return ha.get3dOpacity(d);});
}
HATLASPlot.prototype.addButtons = function(){
    var ha=this;
    // this.buttons2d = d3.select("#buttons-container")
    //     .style("height","auto");
    // this.zDown = d3.select("#button-z-down");
    // this.zUp = d3.select("#button-z-up");
    // this.zDown.on("click",function(){ha.decreaseZ();});
    // this.zUp.on("click",function(){ha.increaseZ();});
    this.divDown = d3.select("div#button-left")
    this.divUp = d3.select("div#button-right")
    this.divDown
        .style("width",this.divDown.style("height"));
    this.divDown.select("img")
        .on("click",function(){ha.decreaseZ();});
    this.divUp
        .style("width",this.divUp.style("height"));
    this.divUp.select("img")
        .on("click",function(){ha.increaseZ();});
    this.updateArrows();
}
HATLASPlot.prototype.updateArrows = function(){
    if (this.tMin2d<=this.dMin.t){
        this.divDown.style({"opacity":0.2,"cursor":"default"})
    }else{
        this.divDown.style({"opacity":1,"cursor":"pointer"})}
    if (this.tMax2d>=this.dMax.t){
        this.divUp.style({"opacity":0.2,"cursor":"default"})
    }else{this.divUp.style({"opacity":1,"cursor":"pointer"})}
}
HATLASPlot.prototype.addNumbers = function(){
    this.numbers = d3.select("#div-numbers")
        // .style("width",this.svg2dWidth)
        .style("height","auto");
    this.numbers.append("span")
        .attr("id","t-range")
        .attr("class","span-num")
        .html(parseFloat(this.tMin2d.toPrecision(3))+'-'+parseFloat(this.tMax2d.toPrecision(3)))
    this.numbers.append("span")
        .attr("id","num-sp")
        .html("<br/>")
    this.numbers.append("span")
        .attr("id","z-range")
        .attr("class","span-num")
        .html(parseFloat(this.zMin2d.toPrecision(3))+'-'+parseFloat(this.zMax2d.toPrecision(3)))
    this.buttons2d = d3.select("#buttons-container")
    this.buttons2d.style({
        "margin-left":(this.svg2dWidth-this.buttons2d.node().getBoundingClientRect()["width"])/2+"px"
    });
    this.updateNumbers();
}
HATLASPlot.prototype.updateNumbers = function(){
    this.numbers.select("span#t-range")
        .html(parseFloat(this.tMin2d.toPrecision(3))+'-'+parseFloat(this.tMax2d).toPrecision(3)+" bn yrs")
    this.numbers.select("span#z-range")
        .html("z = "+parseFloat(this.zMin2d.toPrecision(3))+'-'+parseFloat(this.zMax2d).toPrecision(3))
}
HATLASPlot.prototype.decreaseZ = function(){
    if (this.tMin2d<=this.dMin.t){
        console.log("at minimum");
        return
    }else{
        this.divDown.attr("opacity",1);
        this.tMin2d -= this.tRng2d;
        this.tMax2d -= this.tRng2d;
        this.dataFilt2d = this.filterZ(this.tMin2d,this.tMax2d,'t');
        this.dots2d = this.g2d.selectAll(".dot")
            .data(this.dataFilt2d);
        this.dots2d
            .enter()
            .append("circle")
            .attr("class","dot");
        this.dots2d
            .attr("r",this.dotsize2d)
            .attr("cx",this.xMap2d)
            .attr("cy",this.yMap2d)
            .style("fill", "blue")
            .attr("opacity",function(d){return ha.get2dOpacity(d)});
        this.dots2d.exit().remove();

        //
        this.dots2dHiZ = this.g2dHiZ.selectAll(".dot")
            .data(this.dataHiZ);
        this.dots2dHiZ
            .enter()
            .append("circle")
            .attr("class","dot");
        this.dots2dHiZ
            .attr("r",this.dotsize2d)
            .attr("cx",this.xMap2d)
            .attr("cy",this.yMap2d)
            .style("fill", "red")
            .attr("opacity",function(d){return ha.get2dOpacityHiZ(d)});
        this.dots2dHiZ.exit().remove();
        //
        this.moveSlice();
        this.updateNumbers();
        this.updateArrows();
    }
}
HATLASPlot.prototype.increaseZ = function(){
    if (this.tMax2d>=this.dMax.t){
        console.log("at maximum");
        this.divUp.attr("opacity",0.2);
        return
    }else{
        this.divUp.attr("opacity",1);
        this.tMin2d += this.tRng2d;
        this.tMax2d += this.tRng2d;
        this.dataFilt2d = this.filterZ(this.tMin2d,this.tMax2d,'t');
        this.dots2d = this.g2d.selectAll(".dot")
            .data(this.dataFilt2d);
        this.dots2d
            .enter()
            .append("circle")
            .attr("class","dot");
        this.dots2d
            .attr("r",this.dotsize2d)
            .attr("cx",this.xMap2d)
            .attr("cy",this.yMap2d)
            .style("fill", "blue")
            .attr("opacity",function(d){return ha.get2dOpacity(d)});
        this.dots2d.exit().remove();

        //
        //
        this.dots2dHiZ = this.g2dHiZ.selectAll(".dot")
            .data(this.dataHiZ);
        this.dots2dHiZ
            .enter()
            .append("circle")
            .attr("class","dot");
        this.dots2dHiZ
            .attr("r",this.dotsize2d)
            .attr("cx",this.xMap2d)
            .attr("cy",this.yMap2d)
            .style("fill", "red")
            .attr("opacity",function(d){return ha.get2dOpacityHiZ(d)});
        this.dots2dHiZ.exit().remove();

        //
        this.moveSlice();
        this.updateNumbers();
        this.updateArrows();
    }
}
hap = new HATLASPlot();

// hap.scaleWindow()
hap.drawGraphInit()
