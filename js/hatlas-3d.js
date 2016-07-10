function HATLASPlot(){
    return this;
}

HATLASPlot.prototype.rdz2xy3dFixed = function (RAscl,Decscl,z) {
    //DEPRACATED - REPLACED WITH rdz2xy3d
    //convert from RA,DEC,z to isometric projects
    // from https://en.wikipedia.org/wiki/Isometric_projection
    x = Math.sqrt(1/2) * (RAscl - z)
    y = Math.sqrt(1/6) * (RAscl + 2*Decscl + z)
    return [x,y];
};
HATLASPlot.prototype.rdz2xy3d = function (RAscl,Decscl,z) {
    //convert from RA,DEC,z to isometric projects
    // from https://en.wikipedia.org/wiki/Isometric_projection
    ang1 = Math.asin(Math.tan(30*Math.PI/180));
    ang2 = 45*Math.PI/180;
    // console.log(ang1,ang2);
    x = Math.cos(ang2)*RAscl + Math.sin(-ang2)*z
    y = Math.sin(ang1)*Math.sin(ang2)*RAscl +
        Math.cos(ang1)*Decscl +
        Math.cos(ang1)*Math.cos(ang2)*z;
    return [x,y];
};

HATLASPlot.prototype.scaleData = function(d){
    //scale data
    d.RAscl=(d.RA-this.dCtr.RA)/this.dRng.RA;
    d.Decscl=(d.Dec-this.dCtr.Dec)/this.dRng.Dec;
    d.zscl=-2*(d.z-this.dCtr.z)/this.dRng.z;
    d.tscl=-2*(d.t-this.dCtr.t)/this.dRng.t;
}
HATLASPlot.prototype.scaleRA = function(RA){
    //scale data
    return (RA-this.dCtr.RA)/this.dRng.RA;
}
HATLASPlot.prototype.scaleDec = function(Dec){
    return (Dec-this.dCtr.Dec)/this.dRng.RA;
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
    this.setColors();
    //load data
    d3.csv("data/HATLAS_time_flux_feature_GAMA15.csv", function(error, data){
        // console.log('data read')
        ha.dataAll = data
        ha.dataAll.forEach(function(d){
            d.RA=+d.RA;
            d.Dec=+d.Dec;
            d.z=+d.z;
            d.t=+d.LookbackTime;
        });
        // console.log('formatted');
        //calculate ranges
        ha.dMin={'t':0.0,'z':0};
        ha.dMax={};
        ha.dRng={};
        ha.dCtr={};
        // ha.forceMin={t:0}
        var axes=['RA','Dec','z','t','SFR','F250','F500']
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
        if (ha.dMax.t > 10.0){
            ha.tBgMin = 10.0
        }else{
            ha.tBgMin = ha.dMax.t;
        }
        // ha.dataHiZ = ha.dataAll.filter(function(d){return (d.t > ha.tBgMin);});
        ha.dataFeat = ha.dataAll.filter(function(d){return (d.FeatureType!="-");});
        //
        //
        ha.lines={
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
        //
        ha.scaleWindow();
        ha.make3dPlot();
        ha.make2dPlot();
        ha.addRAButtons();
        ha.addZButtons();
        ha.addZNumbers();
    });
}
HATLASPlot.prototype.setColors = function(){
    this.fgColor="rgba(255,255,255,255)";
    this.bgColor="rgba(0,0,0,255)";
    d3.select("body").style("color",this.fgColor);
    d3.select("body").style("background-color",this.bgColor);
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

    // 3D data -> display
    this.xValue3d = function(d) {return d.x;}
    this.xScale3d = d3.scale.linear()
        .domain([this.dMin.x-0.1,this.dMax.x+0.1])
        .range([0, this.svg3dWidth])
    this.xMap3d = function(d) { return ha.xScale3d(ha.xValue3d(d));}
    this.yValue3d = function(d) {return d.y;}
    this.yScale3d = d3.scale.linear()
        .domain([this.dMin.y-0.1,this.dMax.y+0.1])
        .range([0, this.svg3dHeight])
    this.yMap3d = function(d) { return ha.yScale3d(ha.yValue3d(d));}

    // scale RA
    this.wMin = {}
    this.wMax = {}
    this.wRng = {}
    this.wRng.RA = this.dRng.Dec;
    this.wMin.RA = this.dMin.RA;
    this.wMax.RA = this.wMin.RA + this.wRng.RA;
    this.wRng.Dec = this.dRng.Dec;
    this.wMin.Dec = this.dMin.Dec;
    this.wMax.Dec = this.wMin.Dec + this.wRng.Dec;

    // 2D data -> display
    this.xValue2d = function(d) {return d.RA;}
    this.xScale2d = d3.scale.linear()
        // .domain([this.dMin.RA,this.dMin.RA+this.wSize2d])
        .domain([this.wMin.RA,this.wMax.RA])
        .range([0.01*this.svg2dPlotWidth, 0.99*this.svg2dPlotWidth])
    this.xMap2d = function(d) { return ha.xScale2d(ha.xValue2d(d));}
    //x-axis scale
    this.xScale2dAxis = d3.scale.linear()
        .domain([this.dMin.RA,this.dMax.RA])
        .range([0.01*this.svg2dPlotWidth,
            0.99*this.svg2dPlotWidth*this.dRng.RA/this.wRng.RA])
    this.yValue2d = function(d) {return d.Dec;}
    this.yScale2d = d3.scale.linear()
        .domain([this.dMin.Dec,this.dMax.Dec])
        .range([0.99*this.svg2dPlotHeight, 0.01*this.svg2dPlotHeight])
    this.yMap2d = function(d) { return ha.yScale2d(ha.yValue2d(d));}

    // flux to opacity scale
    this.fValue = function(d){return Math.log10(d.F500)}
    this.fScale2d = d3.scale.linear()
        .domain([Math.log10(this.dMin.F500),Math.log10(this.dMax.F500)])
        .range([0.2,1])
}
HATLASPlot.prototype.filterFlux = function(){
    // filter to return data in window
    threshold = 8e-3*d3.max(this.dataAll,function(d){return d.F250})
    dataFilt = this.dataAll.filter(function(d){
        return (d.F250>threshold);
    });
    return dataFilt;
}
HATLASPlot.prototype.filterData = function(){
    // filter to return data in window
    ha=this;
    axes=['RA','Dec','t']
    this.dataAll.forEach(function(d){
        d.inSlice=1;
        d.inBorder=1;
        for (a=0;a<axes.length;a++){
            ax=axes[a];
            if ((d[ax]>=ha.wMin[ax]-ha.wRng[ax])&(d[ax]<=ha.wMax[ax]+ha.wRng[ax])){
                d.inBorder *= 2}
            if ((d[ax]>=ha.wMin[ax])&(d[ax]<=ha.wMax[ax])){
                d.inSlice *= 2}
        }
    })
    dataFilt = this.dataAll.filter(function(d){
        return (d.inSlice==8);
    });
    this.wMin.z = d3.min(dataFilt,function(d){return d.z});
    this.wMax.z = d3.max(dataFilt,function(d){return d.z});

    // filter features
    this.dataFeat.forEach(function(d){
        d.inSlice=1;
        d.inBorder=1;
        for (a=0;a<axes.length;a++){
            ax=axes[a];
            if ((d[ax]>=ha.wMin[ax]-ha.wRng[ax])&(d[ax]<=ha.wMax[ax]+ha.wRng[ax])){
                d.inBorder *= 2}
            if ((d[ax]>=ha.wMin[ax])&(d[ax]<=ha.wMax[ax])){
                d.inSlice *= 2}
        }
        d.inSlice = (d.inSlice==8) ? 1 : 0
    });
    return dataFilt;
}
HATLASPlot.prototype.filterSDSS = function(dataIn){
    // Filter data that has SDSS value
    dataFilt = dataIn.filter(function(d){
        return (d.Z_SPEC > -50);
    });
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
    if(d.inSlice==8){return 1;}else{return 0.3;};
}
HATLASPlot.prototype.get2dOpacity = function(d) {
    if((d.inSlice==8)&&(d.RA>=this.wMin.RA)&&(d.RA<=this.wMax.RA)){
        return this.fScale2d(this.fValue(d));
    }else{return 0}
}
HATLASPlot.prototype.get2dOpacityHiZ = function(d) {
    if((d.RA>=this.wMin.RA)&&(d.RA<=this.wMax.RA)){
        // return 0.5*this.fScale2d(this.fValue(d));
        return 0;
    }else{return 0};
}
HATLASPlot.prototype.get2dOpacityFeat = function(d) {
    if((d.RA>=this.wMin.RA)&&(d.RA<=this.wMax.RA)){
        if (d.inSlice==1){return 1;}
        else{return 0.5}
    }else{return 0}
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
    //
    this.TValue3d = function(d) {return d.t;}
    this.TScale3d = d3.scale.linear()
        .domain([this.dMin.t,this.dMax.t])
        .range([0, this.getZAxisLength()])
    this.TMap3d = function(d) { return ha.TScale3d(ha.TValue3d(d));}
}

HATLASPlot.prototype.make3dPlot = function(){
    var ha=this;
    // this.color=d3.scale.category20();
    // this.cValue = function(d) {return d.t;};
    this.color3d = d3.scale.linear()
         .domain([ha.dMin.t,0.5*(ha.dMin.t+ha.dMax.t),ha.dMax.t])
         .range(["#5555ff","#55ff55","#ff5555"]);
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
            // .style("color",ha.fgColor);
    this.DecAxis3d = d3.svg.axis()
            .scale(this.yScale3d)
            .orient("left")
            .innerTickSize(-ha.svg3dPlotHeight)
            .outerTickSize(1);
            // .style("color",ha.fgColor);
    this.ZAxis3d = d3.svg.axis()
            .scale(ha.TScale3d)
            .orient("left")
            .innerTickSize([5])
            .outerTickSize(0);
            // .style("color",ha.fgColor);

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
        .attr("dx",20)
        .attr("fill",ha.fgColor);
    this.svg3d.select(".z-axis.axis").append("text")
        .attr("transform","rotate("+(90)+")")
        .attr("class", "z-axis axis-label")
        .attr("x", this.getZAxisLength()/2)
        .attr("y",0)
        .attr("dy", "40px")
        .style("text-anchor", "middle")
        .attr("fill",this.fgColor)
        .text("Lookback Time (billion years)");

    //
    this.data3d = this.filterFlux();
    this.g3d = this.svg3d.append("g")
        .attr("transform", "translate(" + this.margin3d.left + "," +
            this.margin3d.top + ")")
        .attr("class","3d-gals")
    // this.dataFilt = this.dataAll;
    // console.log(this.dataFilt);

    // filter data
    // this.dataFilt3d = this.filterZ(ha.dMin.t,ha.dMax.t,'t');
    // add dots
    this.g3d.selectAll(".dot")
        .data(this.data3d)
        .enter()
        .append("circle")
        .attr("class","dot")
        .attr("r",this.dotsize3d)
        .attr("cx",ha.xMap3d)
        .attr("cy",ha.yMap3d)
        .style("fill", function(d){return ha.color3d(ha.cValue3d(d));})
        .attr("opacity",1);
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
    // this.
    for (l in this.lines){
        // console.log(l,lines[l][0],corners[lines[l][0]],corners[lines[l][0]][0],ha.xScale3d(corners[lines[l][0]][0]));
        line = this.svg3d.append("line")
            // .attr("class",this.lines[l][0]+"-"+this.lines[l][1])
            .attr("x1",this.xScale3d(corners[this.lines[l][0]][0]))
            .attr("x2",this.xScale3d(corners[this.lines[l][1]][0]))
            .attr("y1",this.yScale3d(corners[this.lines[l][0]][1]))
            .attr("y2",this.yScale3d(corners[this.lines[l][1]][1]))
            .style("stroke",this.fgColor)
            .attr("class",className+" "+this.lines[l][0]+"-"+this.lines[l][1]);
    }
}
HATLASPlot.prototype.addDots = function(){
    var ha=this;
    // add galaxies
    this.dots2d = this.g2d.selectAll(".dot")
        .data(this.dataFilt);
    this.dots2d.enter()
        .append("circle")
        .attr("class","dot")
    this.dots2d.exit().remove()
    this.dots2d
        .attr("r",this.dotsize2d+3)
        .attr("cx",ha.xMap2d)
        .attr("cy",ha.yMap2d)
        .style("stroke","rgba(0,0,0,0)")
        .style("stroke-width",3)
        .style("fill",function(d){return ha.color2d(ha.cValue2d(d));})
        .attr("filter","url(#blur)")
        .attr("opacity",function(d){return ha.get2dOpacity(d)});
    // add SDSS
    this.dots2dSDSS = this.g2dSDSS.selectAll(".dot")
        .data(this.dataSDSS)
    this.dots2dSDSS.enter()
        .append("rect")
        .attr("class","dot")
    this.dots2dSDSS.exit().remove()
    this.dots2dSDSS
        .attr("x",0)
        .attr("y",0)
        .attr("width",2*(ha.dotsize2d+5))
        .attr("height",2*(ha.dotsize2d+5))
        .attr("transform",function(d){
            return "translate("+(-(ha.dotsize2d+5))+","+(-(ha.dotsize2d+5))+")"+
            "rotate(45) "+
            "translate ("+(Math.sqrt(0.5)*(ha.xMap2d(d)+ha.yMap2d(d)+0.5*(ha.dotsize2d+5)))+","+
            (Math.sqrt(0.5)*(ha.yMap2d(d)-ha.xMap2d(d)-Math.sqrt(2)*(ha.dotsize2d+5)))+")"
        })
        // .attr("transform",function(d){
        //     return "translate("+(-ha.xMap2d(d))+","+(-ha.yMap2d(d))+") "+
        //     "rotate(45) "+
        //     "translate("+(ha.xMap2d(d)-(ha.dotsize2d+5))+","+
        //     (ha.yMap2d(d)-(ha.dotsize2d+5))+")"})
        .style("stroke","rgba(255,255,0,255)")
        .style("stroke-width",2)
        .style("fill","rgba(0,0,0,0)")
        .attr("opacity",0.5);

    //style HiZ galaxies
    // this.dots2dHiZ
    //     .attr("cx",this.xMap2d)
    //     .attr("opacity",function(d){return ha.get2dOpacityHiZ(d)});

    // add Features
    this.dots2dFeat = this.g2dFeat.selectAll(".dot")
        .data(this.dataFeat);
    this.dots2dFeat
        .enter()
        .append("circle")
        .attr("class","dot")
    this.dots2dFeat.exit().remove()
    this.dots2dFeat
        .attr("r",this.dotsize2d+8)
        .attr("cx",ha.xMap2d)
        .attr("cy",ha.yMap2d)
        .style("stroke",function(d){return ha.color2d(ha.cValue2d(d));})
        .style("stroke-width",2)
        .style("fill","rgba(255,255,255,0)")
        // .attr("filter","url(#blur)")
        .attr("opacity",function(d){return ha.get2dOpacityFeat(d)});

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
    // define blur
    this.filter = this.svg2d.append("defs")
        .append("filter")
            .attr("id", "blur")
        .append("feGaussianBlur")
            .attr("in","SourceGraphic")
            .attr("stdDeviation", 2);
    this.svg2d.select("defs")
        .append("filter")
            .attr("id", "blurbg")
        .append("feGaussianBlur")
            .attr("in","SourceGraphic")
            .attr("stdDeviation", 2);
    //define axis function
    this.RAAxis2d = d3.svg.axis()
            .scale(this.xScale2dAxis)
            .orient("bottom")
            .innerTickSize(-10)
            .outerTickSize(-10)
            .ticks(20);
    this.DecAxis2d = d3.svg.axis()
            .scale(this.yScale2d)
            .orient("left")
            .innerTickSize(-10)
            .outerTickSize(0);
    // Filter Data
    this.wRng.t = 0.05*ha.dRng.t;
    this.wMin.t = 0;
    this.wMax.t = this.dMin.t + this.wRng.t;

    this.dataFilt = this.filterData()
    this.dataSDSS = this.filterSDSS(this.dataFilt);

    this.color2d = this.color3d;
    this.cValue2d = this.cValue3d;
    this.dotsize2d=3;

    //add groups
    this.g2dHiZ = this.svg2d.append("g")
        .attr("transform", "translate(" + this.margin2d.left + "," +
            this.margin2d.top + ")")
        .attr("class","2d-gals-hiZ");
    this.g2d = this.svg2d.append("g")
        .attr("transform", "translate(" + this.margin2d.left + "," +
            this.margin2d.top + ")")
        .attr("class","2d-gals");
    this.g2dSDSS = this.svg2d.append("g")
        .attr("transform", "translate(" + this.margin2d.left + "," +
            this.margin2d.top + ")")
        .attr("class","2d-sdss");
    this.g2dFeat = this.svg2d.append("g")
        .attr("transform", "translate(" + this.margin2d.left + "," +
            this.margin2d.top + ")")
        .attr("class","2d-gals-feat");
    //add BG galaxies
    // this.dots2dHiZ = this.g2dHiZ.selectAll(".dot")
    //     .data(this.dataHiZ);
    // this.dots2dHiZ.enter()
    //     .append("circle")
    //     .attr("class","dot")
    // this.dots2dHiZ
    //     .attr("r",this.dotsize2d+3)
    //     .attr("cx",ha.xMap2d)
    //     .attr("cy",ha.yMap2d)
    //     .style("fill", function(d){return ha.color2d(ha.cValue2d(d));})
    //     .style("stroke","rgba(0,0,0,0)")
    //     .style("stroke-width",3)
    //     .attr("filter","url(#blurbg)")
    //     .attr("opacity",function(d){return ha.get2dOpacityHiZ(d)});
    this.addDots();

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
        .attr("fill",ha.fgColor)
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
        .attr("fill",ha.fgColor)
        .text("Declination");
    // axis color
    this.svg2d.selectAll(".axis line")
        .style("stroke",ha.fgColor)
    this.svg2d.selectAll(".axis text")
        .attr("fill",ha.fgColor)
        // .style("font-size","small")
    //add border
    this.svg2d.append("g")
        .attr("class", "border")
        .attr("transform", "translate("+this.margin2d.left+"," +
            (this.margin2d.top) +")");
    this.svg2d.select(".border")
        .append("line")
        .attr("x1",0).attr("x2",this.svg2dPlotWidth)
        .attr("y1",0).attr("y2",0)
        .style("stroke",ha.fgColor).attr("stroke-width",2)
        .attr("opacity",1);
    this.svg2d.select(".border")
        .append("line")
        .attr("x1",0).attr("x2",this.svg2dPlotWidth)
        .attr("y1",this.svg2dPlotHeight).attr("y2",this.svg2dPlotHeight)
        .style("stroke",ha.fgColor).attr("stroke-width",2)
        .attr("opacity",1);
    this.svg2d.select(".border")
        .append("line")
        .attr("x1",this.svg2dPlotWidth).attr("x2",this.svg2dPlotWidth)
        .attr("y1",0).attr("y2",this.svg2dPlotHeight)
        .style("stroke",ha.fgColor).attr("stroke-width",2)
        .attr("opacity",1);
    this.svg2d.select(".border")
        .append("line")
        .attr("x1",0).attr("x2",0)
        .attr("y1",0).attr("y2",this.svg2dPlotHeight)
        .style("stroke",ha.fgColor).attr("stroke-width",2)
        .attr("opacity",1);
    // add 2d slices to 3d window
    this.slices = this.svg3d.append("g")
        .attr("transform", "translate(" + this.margin2d.left + "," +
            this.margin2d.top + ")")
    ha.addSlice();

}
HATLASPlot.prototype.getSliceCorners = function(){
    console.log(ha.wMin.RA,ha.wMax.RA,ha.wMin.Dec,ha.wMax.Dec,ha.wMin.t,ha.wMax.t,ha.wMin.z,ha.wMax.z);
    return {
        x0y0z0:ha.rdz2xy3d(ha.scaleRA(ha.wMin.RA),ha.scaleDec(ha.wMin.Dec),ha.scaleT(ha.wMin.t)),
        x1y0z0:ha.rdz2xy3d(ha.scaleRA(ha.wMax.RA),ha.scaleDec(ha.wMin.Dec),ha.scaleT(ha.wMin.t)),
        x0y1z0:ha.rdz2xy3d(ha.scaleRA(ha.wMin.RA),ha.scaleDec(ha.wMax.Dec),ha.scaleT(ha.wMin.t)),
        x0y0z1:ha.rdz2xy3d(ha.scaleRA(ha.wMin.RA),ha.scaleDec(ha.wMin.Dec),ha.scaleT(ha.wMax.t)),
        x1y1z0:ha.rdz2xy3d(ha.scaleRA(ha.wMax.RA),ha.scaleDec(ha.wMax.Dec),ha.scaleT(ha.wMin.t)),
        x0y1z1:ha.rdz2xy3d(ha.scaleRA(ha.wMin.RA),ha.scaleDec(ha.wMax.Dec),ha.scaleT(ha.wMax.t)),
        x1y0z1:ha.rdz2xy3d(ha.scaleRA(ha.wMax.RA),ha.scaleDec(ha.wMin.Dec),ha.scaleT(ha.wMax.t)),
        x1y1z1:ha.rdz2xy3d(ha.scaleRA(ha.wMax.RA),ha.scaleDec(ha.wMax.Dec),ha.scaleT(ha.wMax.t))
    }
}
HATLASPlot.prototype.getBGCorners = function(){
    return {
        x0y0z0:ha.rdz2xy3d(ha.scaleRA(ha.wMin.RA),ha.scaleDec(ha.wMin.Dec),ha.scaleT(ha.wMin.t)),
        x1y0z0:ha.rdz2xy3d(ha.scaleRA(ha.wMax.RA),ha.scaleDec(ha.wMin.Dec),ha.scaleT(ha.wMin.t)),
        x0y1z0:ha.rdz2xy3d(ha.scaleRA(ha.wMin.RA),ha.scaleDec(ha.wMax.Dec),ha.scaleT(ha.wMin.t)),
        x0y0z1:ha.rdz2xy3d(ha.scaleRA(ha.wMin.RA),ha.scaleDec(ha.wMin.Dec),ha.scaleT(ha.wMax.t)),
        x1y1z0:ha.rdz2xy3d(ha.scaleRA(ha.wMax.RA),ha.scaleDec(ha.wMax.Dec),ha.scaleT(ha.wMin.t)),
        x0y1z1:ha.rdz2xy3d(ha.scaleRA(ha.wMin.RA),ha.scaleDec(ha.wMax.Dec),ha.scaleT(ha.wMax.t)),
        x1y0z1:ha.rdz2xy3d(ha.scaleRA(ha.wMax.RA),ha.scaleDec(ha.wMin.Dec),ha.scaleT(ha.wMax.t)),
        x1y1z1:ha.rdz2xy3d(ha.scaleRA(ha.wMax.RA),ha.scaleDec(ha.wMax.Dec),ha.scaleT(ha.wMax.t))
    }
}
HATLASPlot.prototype.addSlice = function(){
    ha=this;
    this.add3dBox(this.getSliceCorners(),"slice-lines");
}
HATLASPlot.prototype.moveSlice = function(){
    // this.svg3d.selectAll("line.slice-lines").remove()
    // this.add3dBox(this.getSliceCorners(),"slice-lines");
    newCorners = this.getSliceCorners()
    for (l in this.lines){
        // console.log(l,lines[l][0],corners[lines[l][0]],corners[lines[l][0]][0],ha.xScale3d(corners[lines[l][0]][0]));
        // console.log("line.3dBox."+this.lines[l][0]+"-"+this.lines[l][1]);
        line = this.svg3d.select("line.slice-lines."+this.lines[l][0]+"-"+this.lines[l][1])
            .transition().duration(1000)
            .attr("x1",this.xScale3d(newCorners[this.lines[l][0]][0]))
            .attr("x2",this.xScale3d(newCorners[this.lines[l][1]][0]))
            .attr("y1",this.yScale3d(newCorners[this.lines[l][0]][1]))
            .attr("y2",this.yScale3d(newCorners[this.lines[l][1]][1]))
    }
    //change dot opacity within slice
    // this.g3d.selectAll(".dot")
    //     .data(this.dataAll)
    //     .transition().duration(500)
    //     .attr("opacity",function(d){return ha.get3dOpacity(d);});
}
HATLASPlot.prototype.addRAButtons = function(){
    var ha=this;
    this.divRAUp = d3.select("div#button-RA-right")
    this.divRADown = d3.select("div#button-RA-left")
    this.divRAUp
        .style("top","45%").style("left","85%")
    this.divRAUp.select("img")
        .on("click",function(){ha.moveRA(1)});
    this.divRADown
        .style("top","45%").style("left","15%")
    this.divRADown.select("img")
        .on("click",function(){ha.moveRA(-1)});
    this.updateRAButtons();
}
HATLASPlot.prototype.updateRAButtons = function(){
    if (this.wMin.RA <= 0.01*this.dMin.RA){
        this.divRADown.select("img")
            .attr("title","")
            .style({"opacity":0.0,"cursor":"default"})
    }else{this.divRADown.select("img")
            .attr("title","Move left")
            .style({"opacity":0.5,"cursor":"pointer"})}
    if (this.wMax.RA >= 0.99*this.dMax.RA){
        this.divRAUp.select("img")
            .attr("title","")
            .style({"opacity":0.0,"cursor":"default"})
    }else{this.divRAUp.select("img")
            .attr("title","Move right")
            .style({"opacity":0.5,"cursor":"pointer"})}
}
HATLASPlot.prototype.addZButtons = function(){
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
        .on("click",function(){ha.moveZ(-1);});
    this.divUp
        .style("width",this.divUp.style("height"));
    this.divUp.select("img")
        .on("click",function(){ha.moveZ(+1);});
    this.updateZArrows();
}
HATLASPlot.prototype.updateZArrows = function(){
    if (this.wMin.t<=0.01*this.dMin.t){
        this.divDown.style({"opacity":0.2,"cursor":"default"})
    }else{
        this.divDown.style({"opacity":1,"cursor":"pointer"})}
    if (this.wMax.t>=0.99*this.dMax.t){
        this.divUp.style({"opacity":0.2,"cursor":"default"})
    }else{this.divUp.style({"opacity":1,"cursor":"pointer"})}
}
HATLASPlot.prototype.addZNumbers = function(){
    this.numbers = d3.select("#div-numbers")
        // .style("width",this.svg2dWidth)
        .style("height","auto")
        .style("width",0.5*this.svg2dWidth+"px")
        .style("text-align","center");
    this.numbers.append("span")
        .attr("id","t-range")
        .attr("class","span-num")
    this.numbers.append("span")
        .attr("id","num-sp")
        .html("<br/>")
    this.numbers.append("span")
        .attr("id","z-range")
        .attr("class","span-num")
    this.buttons2d = d3.select("#buttons-container")
    this.buttons2d.style({
        "margin-left":(this.svg2dWidth-this.buttons2d.node().getBoundingClientRect()["width"])/2+"px"
    });
    this.updateZNumbers();
}
HATLASPlot.prototype.updateZNumbers = function(){
    this.numbers.select("span#t-range")
        .html("Lookback Time: "+parseFloat(this.wMin.t.toPrecision(3))+'-'+parseFloat(this.wMax.t).toPrecision(3)+" bn yrs")
    this.numbers.select("span#z-range")
        .html("Redshift: "+parseFloat(this.wMin.z.toFixed(3))+'-'+parseFloat(this.wMax.z).toFixed(3))
}
HATLASPlot.prototype.moveRA = function(inc){
    var ha=this;
    inc = (inc) ? inc : 0.5;
    if(inc==0){return}
    if((inc<0)&&(this.wMin.RA<=0.01*this.dMin.RA)){return}
    if((inc>0)&&(this.wMax.RA>=0.99*this.dMax.RA)){return}
    //add to RA limits
    this.wMin.RA += this.wRng.RA*inc;
    this.wMax.RA += this.wRng.RA*inc;
    this.xScale2d = d3.scale.linear()
        .domain([this.wMin.RA,this.wMax.RA])
        .range([0.01*this.svg2dPlotWidth, 0.99*this.svg2dPlotWidth])
    this.xMap2d = function(d) { return ha.xScale2d(ha.xValue2d(d));}
    // new x-axis scale
    this.xScale2dAxis.range()[0] -= this.svg2dPlotWidth*inc
    this.xScale2dAxis.range()[1] -= this.svg2dPlotWidth*inc

    this.dataFilt = this.filterData();
    this.dataSDSS = this.filterSDSS(this.dataFilt);

    this.addDots();

    this.RAAxis2d = d3.svg.axis()
        .scale(this.xScale2dAxis)
        .orient("bottom")
        .innerTickSize(-10)
        .outerTickSize(0);

    this.svg2d.select(".x-axis.axis") // change the x axis
        .call(ha.RAAxis2d);
    this.moveSlice();
    this.updateRAButtons();
}
HATLASPlot.prototype.moveZ = function(inc){
    if((inc<0)&&(this.wMin.t<=this.dMin.t)){return}
    if((inc>0)&&(this.wMax.t>=this.dMax.t)){return}
    // this.divDown.attr("opacity",1);
    this.wMin.t += this.wRng.t*inc;
    this.wMax.t += this.wRng.t*inc;

    //this.setSlices(this.wMin.t,this.wMax.t,'t');
    this.dataFilt = this.filterData();
    this.dataSDSS = this.filterSDSS(this.dataFilt);


    // this.dots2d = this.g2d.selectAll(".dot")
    //         .data(this.dataFilt);
    // this.dots2d
    //     .enter()
    //     .append("circle")
    //     .attr("class","dot");
    // this.dots2d.exit().remove();
    //
    // this.dots2dSDSS = this.g2dSDSS.selectAll(".dot")
    //     .data(this.dataSDSS);
    // this.dots2dSDSS.enter()
    //     .append("circle")
    //     .attr("class","dot")
    // this.dots2dSDSS.exit().remove();

    this.addDots();
    // this.dots2d
    //     .attr("opacity",function(d){return ha.get2dOpacity(d)});


    this.moveSlice();
    this.updateZNumbers();
    this.updateZArrows();
}

hap = new HATLASPlot();

// hap.scaleWindow()
hap.drawGraphInit()
