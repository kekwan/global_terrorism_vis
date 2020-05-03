d3.csv('./data/globalterrorism_19702018.csv').then((result) => {
    let textColumns = ["country_txt", "region_txt", "provstate", "city"
        , "attacktype1_txt", "weaptype1_txt", "weapsubtype1_txt"];

    /* 
        Change all non-text columns to numbers
    */
    result.forEach(d => {
        const columns = Object.keys(d)
        for (const col of columns) {
            if (!textColumns.includes(col))
                d[col] = +d[col];
        }
    });

    /*
        Initialize checkboxes
    */
    $("#otherCheck").prop('checked', true);
    $("#bombCheck").prop('checked', true);
    $("#assaultCheck").prop('checked', true);

    let yearChart = new YearChart({ parentElement: "#yearChart", data: result });
    let symbolChart = new SymbolMap({ parentElement: "#worldMap", data: result });

    /*
        Event listener to toggle between the set year ranges
    */
    $("#toggleView").click(() => {
        if ($("#toggleView").val() == "Overview") {
            $("#toggleView").html("Overview");
            $("#toggleView").val("Detailed");
            yearChart.updateDetailedView();
            $("#yearButtonGroup").toggle();
            $("#attackBox").toggle();
            $("#cardIcons").toggle();

        } else {
            $("#toggleView").html("Detailed");
            $("#toggleView").val("Overview");
            $("#otherCheck").prop('checked', true);
            $("#bombCheck").prop('checked', true);
            $("#assaultCheck").prop('checked', true);
            yearChart.updateGeneralView();
            $("#yearButtonGroup").toggle();
            $("#attackBox").toggle();
            $("#cardIcons").toggle();
        }
    })

    /*
        nextButton and prevButton is used to toggle between the 
        different sets of year for the detailed chart.
    */
    $("#nextButton").click(() => {
        yearChart.updateDetailedView(true, false);
    })

    $("#prevButton").click(() => {
        yearChart.updateDetailedView(false, false);
    })

    /*
        Event listeners for handling events within the checkbox window. 
    */
    $(":checkbox").on("click", function () {
        yearChart.updateDetailedView(false, true);
    });

    $("#resetButton").click(() => {
        $("#otherCheck").prop('checked', true);
        $("#bombCheck").prop('checked', true);
        $("#assaultCheck").prop('checked', true);
        yearChart.updateDetailedView(false, true);
    })
});