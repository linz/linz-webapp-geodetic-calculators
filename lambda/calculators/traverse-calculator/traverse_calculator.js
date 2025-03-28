Math.radians = function(degrees) { return degrees * Math.PI / 180; };
Math.degrees = function(radians) { return radians * 180 / Math.PI; };

var LINZ=LINZ || {};

config=
{
    'dist_ndp': 2,
    'en_ndp': 2,
    'area_ndp': 2,
    'max_rf': 1000000,
    'link_to_metre': 0.201168
};

LINZ.tctotal=function(e,n)
{
    this.e0=e || 0.0;
    this.n0=n || 0.0;
    this.e1=e || 0.0;
    this.n1=n || 0.0;
    this.reset();
}

LINZ.tctotal.prototype.setEnd=function(e,n)
{
    this.e1=e;
    this.n1=n;
}

LINZ.tctotal.prototype.reset=function(bowditch)
{
    this.bde=0.0;
    this.bdn=0.0;
    if( bowditch && this.length > 0 )
    {
        this.bde=(this.e1-this.e)/this.length;
        this.bdn=(this.n1-this.n)/this.length;
    }
    this.e=this.e0;   // Current uncorrected east
    this.n=this.n0;   // Current uncorrected north
    this.ec=this.e0;  // Current corrected east
    this.nc=this.n0;  // Current corrected north
    this.de=0.0;      // Last east change
    this.dn=0.0;      // Last north change
    this.bcde=0.0;    // Last east bowditch correction
    this.bcdn=0.0;    // Last north bowditch correction
    this.count=0;
    this.length=0.0;
    this.area=0.0;
}

LINZ.tctotal.prototype.add=function( bearing, distance )
{
    this.de = distance*Math.sin(Math.radians(bearing));
    this.dn = distance*Math.cos(Math.radians(bearing));
    this.bcde = this.bde*distance;
    this.bcdn = this.bdn*distance;
    var ec=this.ec;
    var nc=this.nc;
    this.e += this.de;
    this.n += this.dn;
    this.ec += this.de+this.bcde;
    this.nc += this.dn+this.bcdn;
    this.length += distance;
    this.area += ((ec-this.e0)*(nc-this.nc)-(nc-this.n0)*(ec-this.ec))/2.0;
    this.count++;
}

LINZ.tctotal.prototype.miscloseE=function()
{
    return this.e-this.e1;
}

LINZ.tctotal.prototype.miscloseN=function()
{
    return this.n-this.n1;
}

LINZ.tctotal.prototype.miscloseBearing=function()
{
    var de=this.e-this.e1;
    var dn=this.n-this.n1;
    if( de == 0.0 && dn == 0.0 )
    {
        return LINZ.tcobs.bearing_string(0,0,0);
    }
    var angle=Math.degrees(Math.atan2(de,dn));
    if( angle < 0.0 ) angle += 360.0;
    var deg=Math.floor(angle);
    angle=(angle-deg)*60.0;
    var min=Math.floor(angle);
    angle=(angle-min)*60.0;
    var sec=Math.floor(angle);
    return LINZ.tcobs.bearing_string( deg, min, sec );
}

LINZ.tctotal.prototype.miscloseDistance=function()
{
    var de=this.e-this.e1;
    var dn=this.n-this.n1;
    return Math.sqrt(de*de+dn*dn);
}

LINZ.tctotal.prototype.miscloseRf=function( bearing, distance )
{
    var err=this.miscloseDistance();
    var length=this.length;
    if( length <= 0.0 ) return '';
    if( err < length/config.max_rf ) return '1:>'+config.max_rf.toFixed(0);
    return '1:'+(length/err).toFixed(0);
}

LINZ.tctotal.prototype.totalArea=function( bearing, distance )
{
    return Math.abs(this.area);
}


//===========================================================

LINZ.tcvalid={};

LINZ.tcvalid.number=function(el,printel,ndp,dflt,factor)
{
    var re=/^(\d+(?:\.\d{1,3})?)$/;
    var match;
    var value=undefined;
    var dtext=el.val().trim();
    if( dtext == "" && dflt !== undefined )
    {
        dtext=dflt.toFixed(ndp);
        el.val(dtext);
    }
    if( match=dtext.match(re) )
    {
        value=parseFloat(dtext);
        if( factor !== undefined ) value *= factor;
        if(printel) printel.text(value.toFixed(ndp));
        el.removeClass("error");
    }
    else if( dtext != "" )
    {
        el.addClass("error");
    }
    return value;
}

// calc is the calculator, used to handle Alt key events
// func is a function to call to ensure that the readxxx
// functions have been called if on an observation element

LINZ.tcvalid.setKeypressHandler=function(element,calc,func)
{
    element.find(".input_data").keypress(function(e){
        if( e.which == 13 )
        {
            var inputs=$(".input_data:visible");
            var idx=inputs.index(this);
            if( idx >= 0 && idx < inputs.length-1 )
            {
                inputs[idx+1].focus();
            }
        }});
    element.find(".endpoint,.distance,.bearing").keypress(function(e){
        // Handle b, r, l, m keys here as need to prevent default behaviour
        var obs=element.data('obs');
        if( e.which == 66 || e.which == 98 )
        {
            if( $(this).hasClass("distance") ) obs.readDistance();
            if( $(this).hasClass("bearing") ) obs.readBearing();
            calc.calc(true);
            event.preventDefault();
        }
        if( e.which == 82 || e.which == 114 )
        {
            calc.reset();
            event.preventDefault();
        }
        if( $(this).hasClass('distance') )
        {
            if( e.which == 76 || e.which == 108 )
            {
                obs.setLinks( true );
            }
            else if( e.which == 77 || e.which == 109 )
            {
                obs.setLinks( false );
            }
        }
        if( ! e.ctrlKey && ! e.altKey && ! e.metaKey ) 
        {
            if( $.inArray(e.which,[32,46,48,49,50,51,52,53,54,55,56,57]) < 0)
            {
                e.preventDefault();
            }
            if( e.keyCode == 32 && ! $(this).hasClass("bearing"))
            {
                e.preventDefault();
            }
        }
    });
}

//===========================================================

LINZ.tcobs=function( prev_el, calc )
{
    var tcel=$(".obs_template").clone();
    var obs=this;
    this.element=tcel;
    this.calc=calc;
    this.distance=undefined;
    this.bearing=undefined;
    tcel.addClass("obs_data");
    tcel.removeClass("obs_template");
    tcel.data('obs',obs);
    tcel.find(".addrow_button").click(function() { 
        new LINZ.tcobs(tcel,calc); 
        });
    tcel.find(".droprow_button").click(function() { 
        tcel.remove();
        calc.calc();
        });
    tcel.find(".reverse_button").click(function() { 
        obs.reverseBearing();
        });
    tcel.find(".bearing").focusout(function(){ 
        obs.readBearing();
        });
    tcel.find(".distance").focusout(function(){ 
        obs.readDistance();
        });
    tcel.find(".links_input").click(function(){ 
        obs.toggleLinks();
        });
    LINZ.tcvalid.setKeypressHandler(tcel,calc,function(){ 
        obs.bearing=obs.readBearing();
        obs.distance=obs.readDistance();
        });
    tcel.insertAfter(prev_el);
    var prevobs=this.prevObs();
    if( prevobs !== undefined ) this.setLinks( prevobs.isLinks() );
    return tcel;
}

LINZ.tcobs.prototype.nextObs=function()
{
    var obs=$("div.calculator").find(".obs_data");
    var idx=obs.index(this.element);
    if( idx >= 0 && idx < obs.length-1 )
    {
        return $(obs[idx+1]).data('obs');
    }
    return undefined;
}

LINZ.tcobs.prototype.prevObs=function()
{
    var obs=$("div.calculator").find(".obs_data");
    var idx=obs.index(this.element);
    if( idx > 0 )
    {
        return $(obs[idx-1]).data('obs');
    }
    return undefined;
}

LINZ.tcobs.prototype.isLinks=function()
{
    return this.element.find(".links_input").val() == "links";
}

LINZ.tcobs.prototype.toggleLinks=function()
{
    this.setLinks( ! this.isLinks() );
}

LINZ.tcobs.prototype.setLinks=function( islinks )
{
    this.element.find(".links_input").val(islinks ? "links" : "metres");
    islinks = this.isLinks();
    var delement=this.element.find(".distance");
    if( islinks ) delement.addClass("links"); else delement.removeClass("links");
    var nextobs=this.nextObs();
    if( nextobs !== undefined && nextobs.distance === undefined )
    {
        nextobs.setLinks(this.isLinks());
    }
    this.readDistance();
}

LINZ.tcobs.bearing_string=function( deg, min, sec )
{
    return deg.toFixed(0)
        +'\u00B0'+('00'+min.toFixed(0)).substr(-2)
        +'\u2032'+('00'+sec.toFixed(0)).substr(-2)+'\u2033';
}

LINZ.tcobs.prototype.reverseBearing=function()
{
    var belement=this.element.find(".bearing");
    var btext=belement.val().trim();
    var re=/^(\d+)(.*)$/;
    if( match=btext.match(re))
    {
        var deg=parseInt(match[1])+180;
        while( deg >= 360 ){ deg -= 360; }
        belement.val(deg.toFixed(0) + match[2]);
    }
    this.readBearing();
}

LINZ.tcobs.prototype.readBearing=function()
{
    var belement=this.element.find(".bearing");
    var bprint=this.element.find(".print_bear");
    bprint.text("");
    var btext=belement.val().trim();
    if( btext == '' )
    {
        belement.removeClass("error");
        this.bearing=undefined;
    }
    else
    {
        var re=/^(\d{1,3})(?:\.([0-5]\d)(?:\.?([0-5]\d))?|\s+([0-5]\d)(?:\s+([0-5]\d))?)?$/;
        var match;
        var bearing=undefined;
        if( match=btext.match(re) )
        {
            var deg=parseInt(match[1]);
            var min=parseInt(match[2] || match[4] || '0');
            var sec=parseInt(match[3] || match[5] || '0');
            if( deg < 360 )
            {
                bearing=deg+min/60+sec/3600;
            }
            bprint.text(LINZ.tcobs.bearing_string(deg,min,sec));
        }
        if( bearing === undefined )
        {
            belement.addClass("error");
        }
        else
        {
            belement.removeClass("error");
        }
        belement.attr('title',bprint.text());
        this.bearing=bearing;
    }
    this.calc.calc();
    this.calc.addEmptyRow();
    return bearing;
}

LINZ.tcobs.prototype.readDistance=function()
{
    var delement=this.element.find(".distance");
    var dprint=this.element.find(".print_dist");
    var islinks=this.isLinks();
    var factor=islinks ? config.link_to_metre : 1.0;
    this.distance=LINZ.tcvalid.number(delement,dprint,config.dist_ndp,undefined,factor);
    delement.attr('title',dprint.text());
    this.calc.calc()
    this.calc.addEmptyRow();
    return this.distance;
}

LINZ.tcobs.prototype.clearResults=function()
{
    this.element.addClass('noprint');
    this.element.find(".results").text("");
}

LINZ.tcobs.prototype.calcobs=function( total, show )
{
    var bearing=this.bearing;
    var distance=this.distance;
    if( distance === undefined || bearing === undefined )
    {
        if( show ) this.clearResults();
        return;
    }
    total.add(bearing, distance);
    if( show )
    {
        this.element.find(".deast").text(total.de.toFixed(config.en_ndp));
        this.element.find(".dnorth").text(total.dn.toFixed(config.en_ndp));
        if( show > 1 )
        {
            this.element.find(".bcdeast").text(total.bcde.toFixed(config.en_ndp));
            this.element.find(".bcdnorth").text(total.bcdn.toFixed(config.en_ndp));
        }
        this.element.find(".east").text(total.ec.toFixed(config.en_ndp));
        this.element.find(".north").text(total.nc.toFixed(config.en_ndp));
        this.element.removeClass('noprint');
    }
}

LINZ.tcobs.prototype.isblank=function()
{
    var dtext=this.element.find(".distance").val().trim();
    var btext=this.element.find(".bearing").val().trim();
    return dtext == '' && btext == '';
}

//===========================================================

LINZ.tccalc=function()
{
    var calc=this;
    $("#help").hide();
    $("input.showhelp").click(function(){calc.showHelp();});
    $("input.closehelp").click(function(){$("#help").hide();});
    $("#resetbutton").click(function(){calc.reset();});
    $("#closebutton").click(function(){ calc.calc(true); });
    $("#end_coord").hide();
    $("#isclosed").click(function(){
        if(calc.isClosedTraverse())
        {
            $("#end_coord").hide();
        }
        else
        {
            $("#end_coord").show();
        }
        calc.calc();
        });
    $(".endpoint").focusout(function(){ calc.calc(); });
    $(".input_data").focusin(function(){ this.select(); });
    LINZ.tcvalid.setKeypressHandler($(".calculator"),calc);
    this.reset();
}

LINZ.tccalc.prototype.isClosedTraverse=function()
{
    return $("#isclosed").prop("checked");
}

LINZ.tccalc.prototype.showHelp=function()
{
    if( $("#help").is(":visible") ) 
    {
        $("#help").hide();
    }
    else
    {
        $("#help").show();
    }
}

LINZ.tccalc.prototype.addEmptyRow=function()
{
    var lastobs=$(".obs_data").last();
    if( ! lastobs.data('obs').isblank() )
    {
        var calc=this;
        new LINZ.tcobs(lastobs,calc);
    }
}

LINZ.tccalc.prototype.calc=function(bowditch)
{
    var se=LINZ.tcvalid.number($("#start_e"),$("#print_start_e"),config.en_ndp,0.0);
    var sn=LINZ.tcvalid.number($("#start_n"),$("#print_start_n"),config.en_ndp,0.0);
    total=new LINZ.tctotal(se,sn);
    if( ! this.isClosedTraverse() )
    {
        var ee=LINZ.tcvalid.number($("#end_e"),$("#print_end_e"),config.en_ndp,0.0);
        var en=LINZ.tcvalid.number($("#end_n"),$("#print_end_n"),config.en_ndp,0.0);
        total.setEnd(ee,en);
    } 
    $(".bowditch.results").text("");
    $("div.area").hide();
    var show=1;
    if( bowditch )
    {
        $(".obs_data").each(function(){
            $(this).data('obs').calcobs(total,0);
            });
        total.reset(true);
        show=2;
    }
    $(".obs_data").each(function(){
        $(this).data('obs').calcobs(total,show);
        });
    $("#misclose").find(".result").text("")
    if( total.count > 0 )
    {
        $("#misclose_bearing").text(total.miscloseBearing());
        $("#misclose_distance").text(total.miscloseDistance().toFixed(config.dist_ndp));
        $("#misclose_rf").text('RF '+total.miscloseRf());
        $("#misclose_e").text(total.miscloseE().toFixed(config.en_ndp));
        $("#misclose_n").text(total.miscloseN().toFixed(config.en_ndp));
    }
    if( bowditch ) { $(".bowditch").show(); }
    if( bowditch && this.isClosedTraverse())
    {
        $("#total_area").text(total.totalArea().toFixed(config.area_ndp));
        $("div.area").show();
    }
}

LINZ.tccalc.prototype.reset=function()
{
    $(".obs_data").remove();
    $(".results").text("");
    $(".endpoint").val("0.00");
    $(".bowditch").hide();
    $("div.area").hide();
    var calc=this;
    var startobs=new LINZ.tcobs($(".obs_template"),calc);
    var drop=startobs.find(".droprow_button");
    drop.remove();
    $("#title").val("Traverse calculator")
    $("#title").focus();
    $("#title").select();
}

//===========================================================

$(document).ready(function(){
    var calc=new LINZ.tccalc();
});
