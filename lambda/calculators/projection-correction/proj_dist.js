

coordsys=null;
number_re=/^(\d+(?:\.\d*)?)?$/;

// Approximate radius of earth for NZ
approx_radius=6374000.0;

setCoordsys = function()
{
    coordsys=tm2000_circuits[$('#coordsys').val()];
}

setNumberValid=function(field)
{
    if( field.val().match(number_re))
    {
        field.removeClass("invalid");
    }
    else
    {
        field.addClass("invalid");
    }
}

clearResults=function()
{
    $('#results').empty();
}

getNumber=function(id,minv,maxv)
{
    var val = $(id).val();
    if( val == '') return null;
    coord=parseFloat(val);
    if( coord == NaN )
    {
        $(id).addClass("invalid");
    }
    else if ( coord < minv || coord > maxv )
    {
        $(id).addClass("invalid")
        coord=NaN;
    }
    return coord;
}

tryCalculate=function()
{
    $('#results').empty();

    if( coordsys === null )
    {
        return;
    }
    var sf=coordsys.sf;
    var e0=coordsys.fe;
    var starte=getNumber('#start_easting',coordsys.mine,coordsys.maxe);
    var ende=getNumber('#end_easting',coordsys.mine,coordsys.maxe);
    var dist=getNumber('#csd_distance',0.0,100000.0);
    if( ende == null ) ende=starte;
    if( isNaN(starte) || starte == null ) return false;
    if( isNaN(ende)) return false;
    if( isNaN(dist) || dist == null ) return false;
    var ea=starte-e0;
    var eb=ende-e0;
    var r=approx_radius;
    var lsf=sf*(1.0+(ea*ea+ea*eb+eb*eb)/(6.0*r*r*sf*sf));
    var corrn=dist*(1.0-1.0/lsf);
    output=$("<p>");

    output.append("Line scale factor: "+lsf.toFixed(6));
    output.append($("<br>"));
    output.append("Projection correction: "+corrn.toFixed(4)+"m");
    $("#results").append(output);
}

setup = function () {
    $('#coordsys').change(setCoordsys)
    $(tm2000_circuits).each(function(id,circuit)
    {
        var option=$('<option>').val(id).text(circuit.name);
        $('#coordsys').append(option);
    });
    $('#coordsys').change(function()
    {
        clearResults();
        setCoordsys();
        tryCalculate();
    });
    setCoordsys();

    $(".number_field").on("input", function(evt) {
        var self = $(this);
        self.val(self.val().replace(/[^0-9\.]/g, ''));
        if ((evt.which != 46 || self.val().indexOf('.') != -1) && (evt.which < 48 || evt.which > 57)) 
        {
          evt.preventDefault();
        }
      });

    $(".number_field").change(function(){
        var current=$(this);
        clearResults();
        setNumberValid(current);
        tryCalculate();
    });
    $(".number_field").keyup(function(evt){
        var current=$(this);
        setNumberValid(current);
        if (evt.keyCode == 13) {
            tryCalculate();
        };
    });     
    $(".number_field").on('paste', function () {
        clearResults();
        var current=$(this);
        setTimeout(function () {
            current.onPaste();
        }, 4);
    });
    $('#calculate').click(tryCalculate);
    
    $('.nojs').hide();
    $('.needjs').show();
}

$(document).ready(setup);
