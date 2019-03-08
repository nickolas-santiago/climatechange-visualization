var m_width = $('#map').width(),
  width = 938,
  height = 400,
  m_height = m_width * height / width,
  country,
  state;

var projection = d3.geo.mercator()
  .scale(150)
  .translate([width / 2, height / 1.5]);

var path = d3.geo.path()
  .projection(projection);

var tempColors = [
  '#08153e', '#0a2a6c', '#134996', '#2d71b4', '#4691c5', '#5eabce', 
  '#86c7da', '#addfec', '#fef383', '#fbde50', '#f2c533', 
  '#e8961a', '#dd6200', '#c64300', '#a72b00', '#7b1c0d'
];

var tempLineGraph = false;
var intervalId;

var svg = d3.select('#map').append('svg')
  .attr('preserveAspectRatio', 'xMidYMid')
  .attr('viewBox', '0 0 ' + width + ' ' + height)
  .attr('width', m_width)
  .attr('height', m_height);

svg.append('rect')
  .attr('class', 'background')
  .attr('width', width)
  .attr('height', height)
  .on('click', country_clicked);

var colorScale = d3.scale.linear().range(tempColors).domain(d3.range(0, tempColors.length));
var tempScale = d3.scale.linear().range([0, tempColors.length]).domain([-40, 40]);

var g = svg.append('g');


var disasterDataObj;
d3.csv('data/disasterData.csv', function(disasterDataSet)
{
    disasterDataObj = filterDisasterDataByYear(disasterDataSet);
});

d3.json('data/countries.topo.json', function(error, us) {
  d3.csv('data/GlobalLandTemperaturesByCountry.csv', function(dataset) {
      
    var dataObj = convertToObject(dataset);
    var plotGraphData = filterDataByCountry(dataset);
    
    var currentYear = document.querySelector("#aslider").value;
    var filtered = dataObj[currentYear + '-01-01'];

    var maxYear = document.querySelector("#aslider").max;
    var minYear = document.querySelector("#aslider").min;
    var month = "01";

    document.querySelector("#title").innerHTML = "Global Surface Temperature by Country in January " + currentYear;

    var cYearDList = [];
    for(var aDisaster in disasterDataObj[currentYear])
    {
        cYearDList.push(aDisaster);
    }
    
    var filtered = dataObj[currentYear + '-' + month + '-01'];

    var maxTemp = 40;
    var minTemp = -40;
    
    dataset.forEach(function(data) {
      var tempNum = Number(data.AverageTemperature);
      if (tempNum < minTemp) {
        minTemp = tempNum;
      }
      if (tempNum > maxTemp) {
        maxTemp = tempNum;
      }
    });

    function updateColorHelper(filtered, d) {
      var countryObj = filtered[d.properties.name];

      if (d.properties.name === 'S. Sudan') {
        countryObj = filtered['Sudan'];
      } else if (d.properties.name === 'Somaliland') {
        countryObj = filtered['Somalia'];
      }

      if (countryObj) {
        var temp = countryObj.avgTemp;
        var colorValue = Math.round(tempScale(temp));
        return colorScale(colorValue);
      }
    }

    g.append('g')
      .attr('id', 'countries')
      .selectAll('path')
      .data(topojson.feature(us, us.objects.countries).features)
      .enter()
      .append('path')
      .attr('id', function(d) { return d.id; })
      .attr('class', 'country')
      .attr('d', path)
      .style('fill', function(d) {
        return updateColorHelper(filtered, d);
      })
      .on('click', function(d)
                   {
                       country_clicked(d);
                       console.log(disasterDataObj[2006][d.id]/*[currentYear][d.properties.id]*/);
                       // document.querySelector("#toolTipCountryName").innerHTML = d.properties.name;
                       if(tempLineGraph == false)
                       {
                            d3.select("#linegraph").remove();
                            d3.select("#toolTipCountryName").style("visibility", "hidden");
                       }
                       if(tempLineGraph == true)
                       {
                           d3.select("#linegraph").remove();
                           d3.select("#toolTipCountryName").style("visibility", "visible");
                           
                           var tempArray = [];
                           
                           for(var k in plotGraphData[d.properties.name])
                           {
                               for(var n = minYear; n < maxYear; n++)
                               {
                                   if(n % 10 == 0)
                                   {
                                   if(k == n + '-' + month + '-01')
                                   {
                                       tempArray.push(plotGraphData[d.properties.name][n + '-' + month + '-01'].avgTemp);
                                   }}
                               }
                           }
                           
                           var miniSvgWidth = (260);
                           var miniSvgWidthPadding = (miniSvgWidth*0.4);
                           var miniSvgWidthWithpadding = miniSvgWidth + miniSvgWidthPadding;
                           var miniSvgHeight = (150);
                           var miniSgvHeightPadding = (miniSvgWidth*0.2);
                           var miniSvgHeightWithPadding = miniSvgHeight + miniSgvHeightPadding;
                           
                           var clicktip = svg
                                            .append("svg")
                                            .attr("width", miniSvgWidthWithpadding)
                                            .attr("height", miniSvgHeightWithPadding)
                                            .attr("id", "linegraph")
                                            .attr('x', 100)
                                            .attr('y', 100)
                                            .on('click', function()
                                               {
                                                   country_clicked(d);
                                                   d3.select("#linegraph").remove();
                                                   d3.select("#toolTipCountryName").style("visibility", "hidden");
                                               });

                           clicktip.append('rect').attr('class', 'linechartBG');
                           clicktip.append("text")
                            .attr("class", "linechartTitle")
                            .attr("x", (miniSvgWidthWithpadding / 2) - 20)
                            .attr("y", 24)
                            .text(d.properties.name);

                           var minTempArray = Math.min.apply(Math,tempArray) - 10;
                           var maxTempArray = Math.max.apply(Math,tempArray) + 10;

                           var yScale = d3.scale.linear()
                            .range([0, miniSvgHeight])
                            .domain([maxTempArray, minTempArray]);

                           var yAxis = d3.svg.axis()
                            .orient('left')
                            .ticks(10)
                            .tickFormat(function(d) { return d + ' °C'; })
                            .scale(yScale);

                           clicktip.append('g')
                            .attr('class', 'axis yAxis')
                            .attr('style', 'transform: translate(' + (miniSvgWidthPadding/2) + 'px,' + miniSgvHeightPadding/2 + 'px)')
                            .call(yAxis);

                           var xScale = d3.scale.linear()
                            .range([0, miniSvgWidth])
                            .domain([minYear, maxYear]);

                           var xAxis = d3.svg.axis()
                            .orient('bottom')
                            .ticks(7)
                            .tickFormat(d3.format("d"))
                            .scale(xScale);

                           clicktip.append('g')
                            .attr('class', 'axis xAxis')
                            .attr('style', 'transform: translate(' + (miniSvgWidthPadding/2) + 'px,' + (miniSvgHeight + miniSgvHeightPadding/2) + 'px)')
                            .call(xAxis);
                                            
                           var vline = d3.svg.line()
                             .x(function(d, i) 
                               {
                                   return ((miniSvgWidthPadding/2) + (i * (miniSvgWidth/tempArray.length))); 
                               })
                             .y(function(d, i)
                               {
                                   return(miniSvgHeightWithPadding - ((Math.abs((Math.min.apply(Math,tempArray)-10) - d)) * (miniSvgHeightWithPadding/(Math.abs((Math.min.apply(Math,tempArray)-10) - (Math.max.apply(Math,tempArray)+10))))));
                               });
                           
                           clicktip.selectAll("plot")
                             .data(tempArray)
                             .enter()
                             .append("circle")
                             .attr("r", 2.5)
                             .attr("cx", function(d,i)
                                  {
                                      return ((miniSvgWidthPadding/2) + (i * (miniSvgWidth/tempArray.length)));
                                  })
                              .attr("cy", function(d,i)
                                   {
                                       return(miniSvgHeightWithPadding - ((Math.abs((Math.min.apply(Math,tempArray)-10) - d)) * (miniSvgHeightWithPadding/(Math.abs((Math.min.apply(Math,tempArray)-10) - (Math.max.apply(Math,tempArray)+10))))));
                                   })
                              .attr("fill", "red");
                                    
                           clicktip.append("path")
                                    .attr("class", "tempLine")
                                    .attr("d", vline(tempArray));
                       }
       });

    function updateColors(currentYear) {
      document.querySelector("#title").innerHTML = "Global Surface Temperature by Country in January " + currentYear;
      var filtered2 = dataObj[currentYear + '-01-01'];
      
      var countries = svg.selectAll(".country")
        .style('fill', function(d) {
          return updateColorHelper(filtered2, d);
        });      
    }

    var playButton = document.querySelector('#playButton');
      
    document.querySelector("#aslider").addEventListener('input', function(e) {
      updateColors(e.target.value);
      clearInterval(intervalId);
      playButton.classList.remove('disabled');
    });

    playButton.addEventListener('click', function(e) {
      var year = 1750;

      intervalId = setInterval(function () {
        year += 1;

        playButton.classList.add('disabled');

        document.querySelector('#aslider').value = year;
        updateColors(year);

        if (year === 2013) {
          clearInterval(intervalId);
          playButton.classList.remove('disabled');
        }
      }, 100);
    });
  });
});

// Temperature Gradient Key
var defs = svg.append('defs');

var tempGradient = defs.append('linearGradient')
  .attr('id', 'tempGradient');

tempGradient.selectAll('stop')
  .data(colorScale.range().reverse())
  .enter()
  .append('stop')
  .attr('offset', function(d, i) {
    return i / (colorScale.range().length - 1);
  })
  .attr('stop-color', function(d) { return d; });

var legendHeight = 160;

var legendsvg = svg.append('rect')
  .attr('id', 'tempLegend')
  .attr('x', 220)
  .attr('y', 10)
  .attr('width', legendHeight)
  .attr('height', 10)
  .style('fill', 'url(#tempGradient)');

var legendScale = d3.scale.linear()
  .range([0, legendHeight])
  .domain([40, -40]);

var tempAxis = d3.svg.axis()
  .orient('right')
  .ticks(5)
  .tickFormat(function(d) { return d + ' °C'; })
  .scale(legendScale);

svg.append('g')
  .attr('class', 'legendAxis')
  .call(tempAxis);

function convertToObject(dataset) {
  var dataObj = {};

  dataset.forEach(function(data) {
    if (!(data.dt in dataObj)) {
      dataObj[data.dt] = {};
    }

    if (!(data.Country in dataObj[data.dt])) {
      dataObj[data.dt][data.Country] = {}
    }

    dataObj[data.dt][data.Country].avgTemp = Number(data.AverageTemperature);
  });

  return dataObj;
}

function filterDataByCountry(dataset)
{
  var dataObj = {};
  dataset.forEach(function(data)
  {
    if(!(data.Country in dataObj))
    {
        dataObj[data.Country] = {};
    }
    if(!(data.dt in dataObj[data.Country]))
    {
        dataObj[data.Country][data.dt] = {};
    }
    dataObj[data.Country][data.dt].avgTemp = Number(data.AverageTemperature);
  });
  return dataObj;
}

function filterDisasterDataByYear(dataset)
{
    var dataObj = {};
    dataset.forEach(function(data)
    {
        if(!(data.year in dataObj))
        {
            dataObj[data.year] = {};
        }
        if(!(data.iso in dataObj[data.year]))
        {
            dataObj[data.year][data.iso] = {};
        }
        if(!(data.disastertype in dataObj[data.year][data.iso]))
        {
            dataObj[data.year][data.iso][data.disastertype] = {};
        }
        dataObj[data.year][data.iso][data.disastertype].count = data.occurrence;
    });
    return dataObj;
}

function zoom(xyz) {
  g.transition()
    .duration(750)
    .attr('transform', 'translate(' + projection.translate() + ')scale(' + xyz[2] + ')translate(-' + xyz[0] + ',-' + xyz[1] + ')')
    .selectAll(['#countries', '#states', '#cities'])
    .style('stroke-width', 1.0 / xyz[2] + 'px')
    .selectAll('.city')
    .attr('d', path.pointRadius(20.0 / xyz[2]));
}

function get_xyz(d) {
  var bounds = path.bounds(d);
  var w_scale = (bounds[1][0] - bounds[0][0]) / width;
  var h_scale = (bounds[1][1] - bounds[0][1]) / height;
  var z = .96 / Math.max(w_scale, h_scale);
  var x = (bounds[1][0] + bounds[0][0]) / 2;
  var y = (bounds[1][1] + bounds[0][1]) / 2 + (height / z / 6);
  return [x, y, z];
}

function country_clicked(d) {
  g.selectAll(['#states', '#cities']).remove();
  state = null;

  if (country) {
    g.selectAll('#' + country.id).style('display', null);
  }

  if (d && country !== d) {
    var xyz = get_xyz(d);
    country = d;

    // if (d.id  == 'USA' || d.id == 'JPN') {
    //   d3.json('data/states_' + d.id.toLowerCase() + '.topo.json', function(error, us) {
    //     g.append('g')
    //       .attr('id', 'states')
    //       .selectAll('path')
    //       .data(topojson.feature(us, us.objects.states).features)
    //       .enter()
    //       .append('path')
    //       .attr('id', function(d) { return d.id; })
    //       .attr('class', 'active')
    //       .attr('d', path)
    //       .on('click', state_clicked);

    //     zoom(xyz);
    //     g.selectAll('#' + d.id).style('display', 'none');
    //   });      
    // } else {
    zoom(xyz);
    tempLineGraph = true;
    // }
  } else {
    var xyz = [width / 2, height / 1.5, 1];
    country = null;
    tempLineGraph = false;
    zoom(xyz);
  }
}

function state_clicked(d) {
  g.selectAll('#cities').remove();

  if (d && state !== d) {
    var xyz = get_xyz(d);
    state = d;

    country_code = state.id.substring(0, 3).toLowerCase();
    state_name = state.properties.name;

    d3.json('data/cities_' + country_code + '.topo.json', function(error, us) {
      g.append('g')
        .attr('id', 'cities')
        .selectAll('path')
        .data(topojson.feature(us, us.objects.cities).features.filter(function(d) { return state_name == d.properties.state; }))
        .enter()
        .append('path')
        .attr('id', function(d) { return d.properties.name; })
        .attr('class', 'city')
        .attr('d', path.pointRadius(20 / xyz[2]));

      zoom(xyz);
    });      
  } else {
    state = null;
    country_clicked(country);
  }
}

$(window).resize(function() {
  var w = $('#map').width();
  svg.attr('width', w);
  svg.attr('height', w * height / width);
});
