/**
 * Helper funcitons for amvi'o inspection pages
 *
 *  Authors: A. Murat Eren <a.murat.eren@gmail.com>
 *           Ozcan Esen
 *           Isaac Fink <iafink@uchicago.edu>
 *
 * Copyright 2015-2021, The anvi'o project (http://anvio.org)
 *
 * Anvi'o is a free software. You can redistribute this program
 * and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU General Public License
 * along with anvi'o. If not, see <http://opensource.org/licenses/GPL-3.0>.
 *
 * @license GPL-3.0+ <http://opensource.org/licenses/GPL-3.0>
 */


GeneParser = (function() {
  function GeneParser(data) {
    this.data = data;
  }

  GeneParser.prototype.filterData = function(start, stop) {
    var gene, _data, _i, _len, _ref;
    _data = [];
    _ref = this.data;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      gene = _ref[_i];

      if (gene.start_in_split > start && gene.start_in_split < stop || gene.stop_in_split > start && gene.stop_in_split < stop || gene.start_in_split <= start && gene.stop_in_split >= stop) {
        _data.push(gene);
      }
    }
    return _data;
  };

  return GeneParser;

})();


function getUrlVars() {
    var map = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        map[key] = value;
    });
    return map;
}

$(document).ready(function() {
  $(window).on('click', function (e) {
    //did not click a popover toggle or popover
    if ($(e.target).data('toggle') !== 'popover'
        && $(e.target).parents('.popover.in').length === 0) {
        $('.popover').popover('hide');
    }
  });
});


function get_gene_functions_table_html(gene){
    functions_table_html =  '<span class="popover-close-button" onclick="$(this).closest(\'.popover\').popover(\'hide\');"></span>';
    functions_table_html += '<h2>Gene Call</h2>';
    functions_table_html += '<table class="table table-striped" style="width: 100%; text-align: center;">';
    functions_table_html += '<thead><th>ID</th><th>Source</th><th>Length</th><th>Direction</th><th>Start</th><th>Stop</th><th>Call type</th><th>Complete</th><th>% in split</th></thead>';
    functions_table_html += '<tbody>';
    functions_table_html += '<tr><td>' + gene.gene_callers_id
                          + '</td><td>' + gene.source
                          + '</td><td>' + gene.length
                          + '</td><td>' + gene.direction
                          + '</td><td>' + gene.start_in_contig
                          + '</td><td>' + gene.stop_in_contig
                          + '</td><td>' + gene.call_type
                          + '</td><td>' + gene.complete_gene_call
                          + '</td><td>' + gene.percentage_in_split.toFixed(2) + '%'
                          + '</td></tr></tbody></table>';

    functions_table_html += '<button type="button" class="btn btn-default btn-sm" onClick="show_sequence(' + gene.gene_callers_id + ');">DNA</button> ';

    if(gene.call_type == 1)
        functions_table_html += '<button type="button" class="btn btn-default btn-sm" onClick="show_aa_sequence(' + gene.gene_callers_id + ');">AA</button> ';
    else
        functions_table_html += '<button type="button" class="btn btn-default btn-sm" disabled>Get AA seq</button> ';

    functions_table_html += '<button type="button" class="btn btn-default btn-sm" onClick="get_sequence_and_blast(' + gene.gene_callers_id + ', \'blastn\', \'nr\', \'gene\');">blastn @ nr</button> ';
    functions_table_html += '<button type="button" class="btn btn-default btn-sm" onClick="get_sequence_and_blast(' + gene.gene_callers_id + ', \'blastn\', \'refseq_genomic\', \'gene\');">blastn @ refseq_genomic</button> ';
    functions_table_html += '<button type="button" class="btn btn-default btn-sm" onClick="get_sequence_and_blast(' + gene.gene_callers_id + ', \'blastx\', \'nr\', \'gene\');">blastx @ nr</button> ';
    functions_table_html += '<button type="button" class="btn btn-default btn-sm" onClick="get_sequence_and_blast(' + gene.gene_callers_id + ', \'blastx\', \'refseq_genomic\', \'gene\');">blastx @ refseq_genomic</button> ';

    if(!gene.functions)
        return functions_table_html;

    functions_table_html += '<h2>Annotations</h2>';
    functions_table_html += '<table class="table table-striped">';
    functions_table_html += '<thead><th>Source</th>';
    functions_table_html += '<th>Accession</th>';
    functions_table_html += '<th>Annotation</th></thead>';
    functions_table_html += '<tbody>';

    const gene_functions = {};
    Object.keys(gene.functions).sort().forEach(function(key) {
      gene_functions[key] = gene.functions[key];
    });

    for (function_source in gene_functions){
        functions_table_html += '<tr>';

        functions_table_html += '<td><b>' + function_source + '</b></td>';
        if (gene.functions[function_source]) {
            functions_table_html += '<td>' + getPrettyFunctionsString(gene.functions[function_source][0], function_source) + '</td>';
            functions_table_html += '<td><em>' + getPrettyFunctionsString(gene.functions[function_source][1]) + '</em></td>';
        } else {
            functions_table_html += '<td>&nbsp;</td>';
            functions_table_html += '<td>&nbsp;</td>';
        }

        functions_table_html += '</tr>';
    }

    functions_table_html += '</tbody></table>';

    return functions_table_html;
}


function get_gene_functions_table_html_for_pan(gene_callers_id, genome_name){
    var gene;

    $.ajax({
        type: 'GET',
        cache: false,
        async: false,
        url: '/data/pan_gene_popup/' + gene_callers_id + '/' + genome_name,
        success: function(data) {
            data.gene_info['genome_name'] = genome_name;
            data.gene_info['gene_callers_id'] = gene_callers_id;
            gene = data.gene_info;
        }
    });

    var aa_sequence_fasta = '>' + gene.gene_callers_id + '_' + gene.genome_name + '\n' + gene.aa_sequence;
    var dna_sequence_fasta = '>' + gene.gene_callers_id + '_' + gene.genome_name + '\n' + gene.dna_sequence;

    functions_table_html =  '<span class="popover-close-button" onclick="$(this).closest(\'.popover\').popover(\'hide\');"></span>';
    functions_table_html += '<h2>Gene Call</h2>';
    functions_table_html += '<table class="table table-striped" style="width: 100%; text-align: center;">';
    functions_table_html += '<thead><th>ID</th><th>Genome</th><th>Length</th><th>Partial</th></thead>';
    functions_table_html += '<tbody>';
    functions_table_html += '<tr><td>' + gene.gene_callers_id
                          + '</td><td>' + gene.genome_name
                          + '</td><td>' + gene.length
                          + '</td><td>' + ((gene.partial == '1') ? 'True' : 'False')
                          + '</td></tr></tbody></table>';
    functions_table_html += '<textarea id="aa_sequence_fasta" style="display: none;">' + aa_sequence_fasta + '</textarea>';
    functions_table_html += '<textarea id="dna_sequence_fasta" style="display: none;">' + dna_sequence_fasta + '</textarea>';
    functions_table_html += '<button type="button" class="btn btn-default btn-sm" onClick="show_sequence_modal(\'AA Sequence\', $(\'#aa_sequence_fasta\').val());">Get AA sequence</button> ';
    functions_table_html += '<button type="button" class="btn btn-default btn-sm" onClick="show_sequence_modal(\'DNA Sequence\', $(\'#dna_sequence_fasta\').val());">Get DNA sequence</button> ';
    functions_table_html += '<button type="button" class="btn btn-default btn-sm" onClick="fire_up_ncbi_blast($(\'#aa_sequence_fasta\').val(), \'tblastn\', \'nr\', \'gene\');">tblastn @ nr</button> ';
    functions_table_html += '<button type="button" class="btn btn-default btn-sm" onClick="fire_up_ncbi_blast($(\'#aa_sequence_fasta\').val(), \'tblastn\', \'refseq_genomic\', \'gene\');">tblastn @ refseq_genomic</button> ';
    functions_table_html += '<button type="button" class="btn btn-default btn-sm" onClick="fire_up_ncbi_blast($(\'#aa_sequence_fasta\').val(), \'blastp\', \'nr\', \'gene\');">blastp @ nr</button> ';
    functions_table_html += '<button type="button" class="btn btn-default btn-sm" onClick="fire_up_ncbi_blast($(\'#aa_sequence_fasta\').val(), \'blastp\', \'refseq_genomic\', \'gene\');">blastp @ refseq_genomic</button> ';

    if(!gene.functions)
        return functions_table_html;

    functions_table_html += '<h2>Annotations</h2>';
    functions_table_html += '<table class="table table-striped">';
    functions_table_html += '<thead><th>Source</th>';
    functions_table_html += '<th>Accession</th>';
    functions_table_html += '<th>Annotation</th></thead>';
    functions_table_html += '<tbody>';

    for (function_source in gene.functions){
        gene.functions[function_source] = gene.functions[function_source].split('|||');
        functions_table_html += '<tr>';

        functions_table_html += '<td><b>' + function_source + '</b></td>';
        if (gene.functions[function_source]) {
            functions_table_html += '<td>' + decorateAccession(function_source, gene.functions[function_source][0]) + '</td>';
            functions_table_html += '<td><em>' + decorateAnnotation(function_source, gene.functions[function_source][1]) + '</em></td>';
        } else {
            functions_table_html += '<td>&nbsp;</td>';
            functions_table_html += '<td>&nbsp;</td>';
        }

        functions_table_html += '</tr>';
    }

    functions_table_html += '</tbody></table>';

    return functions_table_html;
}

function show_sequence_modal(title, content) {
  // remove previous modal window
  $('.modal-sequence').modal('hide');
  $('.modal-sequence').remove();

  $('body').append('<div class="modal modal-sequence" style="z-index: 10000;"> \
      <div class="modal-dialog"> \
          <div class="modal-content"> \
              <div class="modal-header"> \
                  <button class="close" data-dismiss="modal" type="button"><span>&times;</span></button> \
                  <h4 class="modal-title">' + title + '</h4> \
              </div> \
              <div class="modal-body"> \
                      <textarea class="form-control" style="width: 100%; height: 100%; font-family: monospace;" rows="16" onclick="$(this).select();" readonly>' + (content.startsWith('>') ? content : '>' + content) + '</textarea> \
              </div> \
              <div class="modal-footer"> \
                  <button class="btn btn-default" data-dismiss="modal" type="button">Close</button> \
              </div> \
          </div> \
      </div> \
  </div>');
  $('.modal-sequence').modal('show');
  $('.modal-sequence textarea').trigger('click');
}


function show_sequence(gene_id) {
    $.ajax({
        type: 'GET',
        cache: false,
        url: '/data/gene/' + gene_id,
        success: function(data) {
          show_sequence_modal('Gene DNA Sequence', data['header'] + '\n' + data['sequence']);
        }
    });
}


function show_aa_sequence(gene_id) {
    $.ajax({
        type: 'GET',
        cache: false,
        url: '/data/gene/' + gene_id,
        success: function(data) {
          show_sequence_modal('Gene Amino Acid Sequence', data['header'] + '\n' + data['aa_sequence']);
        }
    });
}


function removeGeneChart() {
  var node = document.getElementById("gene-arrow-chart");
  if (node && node.parentNode) {
    node.parentNode.removeChild(node);
  }
}


function drawArrows(_start, _stop, colortype, gene_offset_y, color_genes=null) {
    info("Drawing gene arrows");

    width = VIEWER_WIDTH * 0.80;
    genes = geneParser.filterData(_start, _stop);

    removeGeneChart();

    paths = contextSvg.append('svg:g')
      .attr('id', 'gene-arrow-chart')
      .attr('transform', 'translate(50, ' + (gene_offset_y-10) + ')');

    paths.selectAll('path');

    // Find the max_split
    max_split = _stop - _start;

    // Find the ratio based on screen width and max_split
    ratio = width / max_split;

    // Draw arrows
    genes.forEach(function(gene) {

      diff = 0;

      if (gene.start_in_split < _start) {
        start = 0;
        diff  = _start - gene.start_in_split;
      }

      start = gene.start_in_split < _start ? 0 : (gene.start_in_split - _start) * ratio;
      // start = ratio * (start - gene.start_in_split);
      __stop= (gene.stop_in_split > _stop ? _stop : gene.stop_in_split);
      stop  = (__stop - gene.start_in_split - diff) * ratio;

      var y = 10 + (gene.level * 20);


      let category = getCagForType(gene.functions, colortype);
      category = getCleanCagCode(category);

      if(!category) {
        category = "none";
        if(colortype == "Source") {
          if (gene.source.startsWith('Ribosomal_RNA')) {
            category = 'rRNA';
          } else if (gene.source == 'Transfer_RNAs') {
            category = 'tRNA';
          } else if (gene.functions !== null) {
            category = 'Function';
          }
        }
      }

      if(color_genes != null && !isEmpty(color_genes) && color_genes.includes("" + gene.gene_callers_id)) {
        category = gene.gene_callers_id;
      }

      if (highlight_gene && gene.gene_callers_id == contig_id)
      {
        var offset = 6;
        paths.append('svg:rect')
           .attr('x', start - offset)
           .attr('width', stop + offset * 2)
           .attr('y', y - offset)
           .attr('height', 2 * offset)
           .attr('fill', 'yellow')
           .attr('fill-opacity', 1)
           .attr('stroke-width', 0);
      }

      // M10 15 l20 0
      let color = $('#picker_' + category).length > 0 ? $('#picker_' + category).attr('color') : $('#picker_Other').attr('color');
      path = paths.append('svg:path')
           .attr('id', 'gene_' + gene.gene_callers_id)
           .attr('d', 'M' + start +' '+ y +' l'+ stop +' 0')
           .attr('stroke', color)
           .attr('stroke-width', 6)
           .attr("style", "cursor:pointer;")
           .attr('marker-end', function() {

             if ((gene.direction == 'r' && gene.start_in_split > _start) ||
                 (gene.direction == 'f' && gene.stop_in_split  < _stop)) {
                   return 'url(#arrow_' + category + ')';
                 }

              return '';
           })
           .attr('transform', function() {
               return gene.direction == 'r' ? "translate(" + (2*start+stop) + ", 0), scale(-1, 1)" : "";
             })
           .attr('data-content', get_gene_functions_table_html(gene) + '')
	    .attr('data-toggle', 'popover');
      // disable default right-click behavior
      document.querySelector('#gene_' + gene.gene_callers_id).addEventListener('contextmenu', function (evt) { evt.preventDefault(); });
      $('#gene_' + gene.gene_callers_id).contextmenu(function() {
        toggleGeneIDColor(gene.gene_callers_id);
      });
    });
    $('[data-toggle="popover"]').popover({"html": true, "trigger": "click", "container": "body", "viewport": "body", "placement": "top"});

    // workaround for known popover bug
    // source: https://stackoverflow.com/questions/32581987/need-click-twice-after-hide-a-shown-bootstrap-popover
    $('body').on('hidden.bs.popover', function (e) {
      $(e.target).data("bs.popover").inState.click = false;
    });

    $('[data-toggle="popover"]').on('shown.bs.popover', function (e) {
      var popover = $(e.target).data("bs.popover").$tip;

      if ($(popover).css('top').charAt(0) === '-') {
        $(popover).css('top', '0px');
      }

      if ($(popover).css('left').charAt(0) === '-') {
        $(popover).css('left', '0px');
      }
    });
}

function getGeneEndpts(_start, _stop) {
  genes = geneParser.filterData(_start, _stop);
  var ret = [];

  genes.forEach(function(gene){
    ret.push(gene.start_in_split - _start, gene.stop_in_split - _start - 1);
  });

  return ret;
}

/*
 *  @returns arbitrary category:color dict given a list of categories
 */
function getCustomColorDict(fn_type, cags=null, order=null) {
  if(fn_type == "Source") return default_source_colors;

  if(!cags) {
    cags = Object.values(geneParser["data"]).map(gene => gene.functions ? getCagForType(gene.functions, fn_type) : null)
                                                .filter(o => { if(!o) o = "None"; return o != null });
    cags = cags.filter((item, i) => { return cags.indexOf(item) == i }); // remove duplicates
  }

  // move "Other" and "None" to end of list
  if(cags.includes("Other")) cags.push(cags.splice(cags.indexOf("Other"), 1)[0]);
  if(cags.includes("None")) cags.push(cags.splice(cags.indexOf("None"), 1)[0]);

  let out = custom_cag_colors.reduce((out, field, index) => {
    out[cags[index]] = field;
    return out;
  }, {});

  // sort using order
  if(order) {
    let colors = Object.values(out);
    Object.keys(out).forEach(cag => { out[cag] = colors[order[cag]] });
  }

  if(out["Other"]) out["Other"] = "#FFFFFF";
  if(out["None"]) out["None"] = "#808080";
  delete out["undefined"];
  return out;
  console.log(out);
}

/*
 *  @returns array of functional annotation types from genes
 */
function getFunctionalAnnotations() {
  for(gene of geneParser["data"]) {
    if(!gene.functions) continue;
    return Object.keys(gene.functions);
  }
  return [];
}

/*
 *  @returns array of functional annotation types from genes
 */
function getFunctionalAnnotations() {
  for(gene of geneParser["data"]) {
    if(!gene.functions) continue;
    return Object.keys(gene.functions);
  }
  return [];
}

function orderColorTable(order) {
  order_gene_colors_by_count = order == 'count';
  generateFunctionColorTable(null, $("#gene_color_order").val());
}

function filterColorTable(thresh) {
  if(isNaN(thresh)) {
    alert("Error: filtering threshold must be numeric");
    return;
  } else if(thresh < 1) {
    alert("Error: filtering threshold must be an integer >= 1");
    return;
  }
  thresh_count_gene_colors = thresh;
  generateFunctionColorTable(null, $("#gene_color_order").val());
  redrawArrows();
}

var base_colors = ['#CCB48F', '#727EA3', '#65567A', '#CCC68F', '#648F7D', '#CC9B8F', '#A37297', '#708059'];

function get_comp_nt_color(nts){
    if(nts == "CT" || nts == "TC")
        return "red";
    if(nts == "GA" || nts == "AG")
        return "green";
    if(nts == "AT" || nts == "TA")
        return "blue";
    if(nts == "CA" || nts == "AC")
        return "purple";
    if(nts == "GT" || nts == "TG")
        return "orange";
    else
        return "black";
}

function getCategoryForKEGGClass(class_str) {
  if(class_str == null) return null;

  var category_name = getClassFromKEGGAnnotation(class_str);
  return getKeyByValue(KEGG_categories, category_name);
}

function getClassFromKEGGAnnotation(class_str) {
  return class_str.substring(17, class_str.indexOf(';', 17));
}

// https://stackoverflow.com/questions/9907419/how-to-get-a-key-in-a-javascript-object-by-its-value/36705765
function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

// https://stackoverflow.com/questions/16947100/max-min-of-large-array-in-js
function GetMaxMin(input_array) {
    var max = Number.MIN_VALUE, min = Number.MAX_VALUE;
    for (var i = 0, len=input_array.length; i < len; i++) {
        if (input_array[i] > max) max = input_array[i];
        if (input_array[i] < min) min = input_array[i];
    }
    return { Max: max, Min: min};
}
