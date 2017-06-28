Math.radians = function(degrees) { return degrees * Math.PI / 180; };
Math.degrees = function(radians) { return radians * 180 / Math.PI; };

var LINZ=LINZ || {};

config=
{
    'dist_ndp': 2,
    'en_ndp': 2,
    'max_rf': 1000000
};

LINZ.tctotal=function(e,n)
{
    this.e=e;
    this.n=n;
    this.e0=e;
    this.n0=n;
    this.count=0;
    this.length=0.0
}

LINZ.tctotal.prototype.add=function( bearing, distance )
{
    this.e += distance*Math.sin(Math.radians(bearing));
    this.n += distance*Math.cos(Math.radians(bearing));
    this.length += distance;
    this.count++;
}

LINZ.tctotal.prototype.bearing=function( bearing, distance )
{
    var de=this.e-this.e0;
    var dn=this.n-this.n0;
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

LINZ.tctotal.prototype.distance=function( bearing, distance )
{
    var de=this.e-this.e0;
    var dn=this.n-this.n0;
    return Math.hypot(de,dn);
}

LINZ.tctotal.prototype.rf=function( bearing, distance )
{
    var err=this.distance();
    var length=this.length;
    if( length <= 0.0 ) return '';
    if( err < length/config.max_rf ) return '1:>'+config.max_rf.toFixed(0);
    return '1:'+(length/err).toFixed(0);
}

//===========================================================

LINZ.tcobs=function( prev_el )
{
    var tcel=$(".obs_template").clone();
    var obs=this;
    this.element=tcel;
    tcel.addClass("obs_data");
    tcel.removeClass("obs_template");
    tcel.data(this);
    tcel.find(".addrow_button").click(function() { 
        new LINZ.tcobs(tcel); 
        });
    tcel.find(".droprow_button").click(function() { 
        tcel.remove();
        calc();
        });
    tcel.find(".reverse_button").click(function() { 
        obs.reverseBearing();
        calc();
        });
    tcel.focusout(function(){ calc(); });
    tcel.insertAfter(prev_el);
    return tcel;
}

LINZ.tcobs.bearing_string=function( deg, min, sec )
{
    return deg.toFixed(0)
        +'\u00B0'+('00'+min.toFixed(0)).substr(-2)
        +'\u2032'+('00'+sec.toFixed(0)).substr(-2)+'\u2033';
}

LINZ.tcobs.prototype.reverseBearing=function()
{
    var belement=this.element.find(".bearing").find("input");
    var btext=belement.val().trim();
    var re=/^(\d+)(.*)$/;
    if( match=btext.match(re))
    {
        var deg=parseInt(match[1])+180;
        while( deg >= 360 ){ deg -= 360; }
        belement.val(deg.toFixed(0) + match[2]);
        this.bearing(); // To reset the printed value
    }
}

LINZ.tcobs.prototype.bearing=function()
{
    var belement=this.element.find(".bearing").find("input");
    var bprint=this.element.find(".print_bear");
    bprint.text("");
    var btext=belement.val().trim();
    if( btext == '' )
    {
        belement.removeClass("error");
        return null;
    }
    var re=/^(\d{1,3})(?:\.([0-5]\d|60)(?:\.?([0-5]\d|60))?|\s+([0-5]\d|60)(?:\s+([0-5]\d|60))?)$/;
    var match;
    var bearing=null;
    if( match=btext.match(re) )
    {
        var deg=parseInt(match[1]);
        var min=parseInt(match[2] || match[4]);
        var sec=parseInt(match[3] || match[5] || '0');
        if( deg < 360 )
        {
            bearing=deg+min/60+sec/3600;
        }
        bprint.text(LINZ.tcobs.bearing_string(deg,min,sec));
    }
    if( bearing === null )
    {
        belement.addClass("error");
    }
    else
    {
        belement.removeClass("error");
    }
    return bearing;
}

LINZ.tcobs.prototype.distance=function()
{
    var delement=this.element.find(".distance").find("input");
    var dprint=this.element.find(".print_dist");
    dprint.text("");
    var dtext=delement.val().trim();
    if( dtext == '' )
    {
        delement.removeClass("error");
        return null;
    }
    var re=/^(\d+(?:\.\d{1,3})?)$/;
    var match;
    var distance=null;
    if( match=dtext.match(re) )
    {
        distance=parseFloat(dtext);
        dprint.text(distance.toFixed(config.dist_ndp));
        delement.removeClass("error");
    }
    else
    {
        delement.addClass("error");
    }
    return distance;
}

LINZ.tcobs.prototype.clearResults=function()
{
    this.element.addClass('noprint');
    this.element.find(".results").text("");
}

LINZ.tcobs.prototype.calc=function( total )
{
    var bearing=this.bearing();
    var distance=this.distance();
    if( distance === null || bearing === null )
    {
        this.clearResults();
        return;
    }
    total.add(bearing, distance);
    this.element.find(".east").text(total.e.toFixed(config.en_ndp));
    this.element.find(".north").text(total.n.toFixed(config.en_ndp));
    this.element.removeClass('noprint');
}

LINZ.tcobs.prototype.isblank=function()
{
    var dtext=this.element.find(".distance").find("input").val().trim();
    var btext=this.element.find(".bearing").find("input").val().trim();
    return dtext == '' && btext == '';
}

var addRow=function()
{
    var lastobs=$(".obs_data").last();
    if( ! lastobs.data().isblank() )
    {
        new LINZ.tcobs(lastobs);
    }
}

var calc=function()
{
    total=new LINZ.tctotal(0.0,0.0);
    $(".obs_data").each(function(){
        $(this).data().calc(total);
        });
    $(".misclose").find(".result").text("")
    if( total.count > 0 )
    {
        $(".misclose").find(".bearing").text(total.bearing());
        $(".misclose").find(".distance").text(total.distance().toFixed(config.dist_ndp));
        $(".misclose").find(".rf").text('RF '+total.rf());
        $(".misclose").find(".east").text((total.e-total.e0).toFixed(config.en_ndp));
        $(".misclose").find(".north").text((total.n-total.n0).toFixed(config.en_ndp));
    }
    addRow();
}

var reset=function()
{
    $(".obs_data").remove();
    $(".results").text("");
    var startobs=new LINZ.tcobs($(".obs_template"));
    var drop=startobs.find(".droprow_button");
    drop.off();
    drop.empty();
}


$(document).ready(function(){
    $("#resetbutton").click(reset);
    reset();
});
