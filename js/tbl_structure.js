/* vim: set expandtab sw=4 ts=4 sts=4: */
/**
 * @fileoverview    functions used on the table structure page
 * @name            Table Structure
 *
 * @requires    jQuery
 * @requires    jQueryUI
 * @required    js/functions.js
 */

/**
 * AJAX scripts for tbl_structure.php
 *
 * Actions ajaxified here:
 * Drop Column
 * Add Primary Key
 * Drop Primary Key/Index
 *
 */

/**
 * Unbind all event handlers before tearing down a page
 */
AJAX.registerTeardown('tbl_structure.js', function() {
    $("a.change_column_anchor.ajax").die('click');
    $("button.change_columns_anchor.ajax, input.change_columns_anchor.ajax").die('click');
    $("a.drop_column_anchor.ajax").die('click');
    $("a.add_primary_key_anchor.ajax").die('click');
    $('a.drop_primary_key_index_anchor.ajax').die('click');
    $("#table_index tbody tr td.edit_index.ajax, #indexes .add_index.ajax").die('click');
    $('#index_frm input[type=submit]').die('click');
    $("#move_columns_anchor").die('click');
});

AJAX.registerOnload('tbl_structure.js', function() {
    /**
     * Attach Event Handler for 'Change Column'
     */
    $("a.change_column_anchor.ajax").live('click', function(event) {
        event.preventDefault();
        $('#page_content').hide();
        $.get($(this).attr('href'), {'ajax_request': true}, function(data) {
            if (data.success) {
                $('<div id="change_column_dialog"></div>')
                    .html(data.message)
                    .insertBefore('#page_content');
                PMA_verifyColumnsProperties();
            } else {
                PMA_ajaxShowMessage(PMA_messages['strErrorProcessingRequest'] + " : " + data.error, false);
            }
        });
    });

    /**
     * Attach Event Handler for 'Change multiple columns'
     */
    $("button.change_columns_anchor.ajax, input.change_columns_anchor.ajax").live('click', function(event) {
        event.preventDefault();
        $('#page_content').hide();
        var $form = $(this).closest('form');
        var params = $form.serialize() + "&ajax_request=true&submit_mult=change";
        $.post($form.prop("action"), params, function (data) {
            if (data.success) {
                $('<div id="change_column_dialog"></div>')
                    .html(data.message)
                    .insertBefore('#page_content');
                PMA_verifyColumnsProperties();
            } else {
                PMA_ajaxShowMessage(PMA_messages['strErrorProcessingRequest'] + " : " + data.error, false);
            }
        });
    });

    /**
     * Attach Event Handler for 'Drop Column'
     */
    $("a.drop_column_anchor.ajax").live('click', function(event) {
        event.preventDefault();
        /**
         * @var curr_table_name String containing the name of the current table
         */
        var curr_table_name = $(this).closest('form').find('input[name=table]').val();
        /**
         * @var curr_row    Object reference to the currently selected row (i.e. field in the table)
         */
        var $curr_row = $(this).parents('tr');
        /**
         * @var curr_column_name    String containing name of the field referred to by {@link curr_row}
         */
        var curr_column_name = $curr_row.children('th').children('label').text();
        /**
         * @var $after_field_item    Corresponding entry in the 'After' field.
         */
        var $after_field_item = $("select[name='after_field'] option[value='" + curr_column_name + "']");
        /**
         * @var question    String containing the question to be asked for confirmation
         */
        var question = $.sprintf(PMA_messages['strDoYouReally'], 'ALTER TABLE `' + escapeHtml(curr_table_name) + '` DROP `' + escapeHtml(curr_column_name) + '`;');
        $(this).PMA_confirm(question, $(this).attr('href'), function(url) {
            var $msg = PMA_ajaxShowMessage(PMA_messages['strDroppingColumn'], false);
            $.get(url, {'is_js_confirmed' : 1, 'ajax_request' : true}, function(data) {
                if (data.success == true) {
                    PMA_ajaxRemoveMessage($msg);
                    if ($('#result_query').length) {
                        $('#result_query').remove();
                    }
                    if (data.sql_query) {
                        $('<div id="result_query"></div>')
                            .html(data.sql_query)
                            .prependTo('#page_content');
                    }
                    toggleRowColors($curr_row.next());
                    // Adjust the row numbers
                    for (var $row = $curr_row.next(); $row.length > 0; $row = $row.next()) {
                        var new_val = parseInt($row.find('td:nth-child(2)').text()) - 1;
                        $row.find('td:nth-child(2)').text(new_val);
                    }
                    $after_field_item.remove();
                    $curr_row.hide("medium").remove();
                    // refresh the list of indexes (comes from sql.php)
                    $('#indexes').html(data.indexes_list);
                    PMA_reloadNavigation();
                } else {
                    PMA_ajaxShowMessage(PMA_messages['strErrorProcessingRequest'] + " : " + data.error, false);
                }
            }); // end $.get()
        }); // end $.PMA_confirm()
    }) ; //end of Drop Column Anchor action

    /**
     * Ajax Event handler for 'Add Primary Key'
     */
    $("a.add_primary_key_anchor.ajax").live('click', function(event) {
        event.preventDefault();
        /**
         * @var curr_table_name String containing the name of the current table
         */
        var curr_table_name = $(this).closest('form').find('input[name=table]').val();
        /**
         * @var curr_column_name    String containing name of the field referred to by {@link curr_row}
         */
        var curr_column_name = $(this).parents('tr').children('th').children('label').text();
        /**
         * @var question    String containing the question to be asked for confirmation
         */
        var question = $.sprintf(PMA_messages['strDoYouReally'], 'ALTER TABLE `' + escapeHtml(curr_table_name) + '` ADD PRIMARY KEY(`' + escapeHtml(curr_column_name) + '`);');
        $(this).PMA_confirm(question, $(this).attr('href'), function(url) {
            var $msg = PMA_ajaxShowMessage(PMA_messages['strAddingPrimaryKey'], false);
            $.get(url, {'is_js_confirmed' : 1, 'ajax_request' : true}, function(data) {
                if (data.success == true) {
                    PMA_ajaxRemoveMessage($msg);
                    $(this).remove();
                    if (typeof data.reload != 'undefined') {
                        PMA_commonActions.refreshMain(false, function () {
                            if ($('#result_query').length) {
                                $('#result_query').remove();
                            }
                            if (data.sql_query) {
                                $('<div id="result_query"></div>')
                                    .html(data.sql_query)
                                    .prependTo('#page_content');
                            }
                        });
                        PMA_reloadNavigation();
                    }
                } else {
                    PMA_ajaxShowMessage(PMA_messages['strErrorProcessingRequest'] + " : " + data.error, false);
                }
            }); // end $.get()
        }); // end $.PMA_confirm()
    }); //end Add Primary Key

    /**
     * Ajax Event handler for 'Drop Primary Key/Index'
     */
    $('a.drop_primary_key_index_anchor.ajax').live('click', function(event) {
        event.preventDefault();
        $anchor = $(this);
        /**
         * @var $curr_row    Object containing reference to the current field's row
         */
        var $curr_row = $anchor.parents('tr');
        /** @var    Number of columns in the key */
        var rows = $anchor.parents('td').attr('rowspan') || 1;
        /** @var    Rows that should be hidden */
        var $rows_to_hide = $curr_row;
        for (var i = 1, $last_row = $curr_row.next(); i < rows; i++, $last_row = $last_row.next()) {
            $rows_to_hide = $rows_to_hide.add($last_row);
        }
        var question = $curr_row.children('td').children('.drop_primary_key_index_msg').val();
        $anchor.PMA_confirm(question, $anchor.attr('href'), function(url) {
            var $msg = PMA_ajaxShowMessage(PMA_messages['strDroppingPrimaryKeyIndex'], false);
            $.get(url, {'is_js_confirmed': 1, 'ajax_request': true}, function(data) {
                if (data.success == true) {
                    PMA_ajaxRemoveMessage($msg);
                    var $table_ref = $rows_to_hide.closest('table');
                    if ($rows_to_hide.length == $table_ref.find('tbody > tr').length) {
                        // We are about to remove all rows from the table
                        $table_ref.hide('medium', function() {
                            $('div.no_indexes_defined').show('medium');
                            $rows_to_hide.remove();
                        });
                        $table_ref.siblings('div.notice').hide('medium');
                    } else {
                        // We are removing some of the rows only
                        toggleRowColors($rows_to_hide.last().next());
                        $rows_to_hide.hide("medium", function () {
                            $(this).remove();
                        });
                    }
                    if ($('#result_query').length) {
                        $('#result_query').remove();
                    }
                    if (data.sql_query) {
                        $('<div id="result_query"></div>')
                            .html(data.sql_query)
                            .prependTo('#page_content');
                    }
                    PMA_reloadNavigation();
                } else {
                    PMA_ajaxShowMessage(PMA_messages['strErrorProcessingRequest'] + " : " + data.error, false);
                }
            }); // end $.get()
        }); // end $.PMA_confirm()
    }); //end Drop Primary Key/Index

    /**
     *Ajax event handler for index edit
    **/
    $("#table_index tbody tr td.edit_index.ajax, #indexes .add_index.ajax").live('click', function(event) {
        event.preventDefault();
        if ($(this).find("a").length == 0) {
            // Add index
            var valid = checkFormElementInRange(
                $(this).closest('form')[0],
                'added_fields',
                'Column count has to be larger than zero.'
            );
            if (! valid) {
                return;
            }
            var url = $(this).closest('form').serialize();
            var title = PMA_messages['strAddIndex'];
        } else {
            // Edit index
            var url = $(this).find("a").attr("href");
            if (url.substring(0, 16) == "tbl_indexes.php?") {
                url = url.substring(16, url.length);
            }
            var title = PMA_messages['strEditIndex'];
        }
        url += "&ajax_request=true";
        indexEditorDialog(url, title);
    });

    /**
     * Inline move columns
    **/
    $("#move_columns_anchor").live('click', function(e) {
        e.preventDefault();

        if ($(this).hasClass("move-active")) {
            return;
        }

        /**
         * @var    button_options  Object that stores the options passed to jQueryUI
         *                          dialog
         */
        var button_options = {};

        button_options[PMA_messages['strGo']] = function(event) {
            event.preventDefault();
            var $msgbox = PMA_ajaxShowMessage();
            var $this = $(this);
            var $form = $this.find("form");
            var serialized = $form.serialize();

            // check if any columns were moved at all
            if (serialized == $form.data("serialized-unmoved")) {
                PMA_ajaxRemoveMessage($msgbox);
                $this.dialog('close');
                return;
            }

            $.post($form.prop("action"), serialized + "&ajax_request=true", function (data) {
                if (data.success == false) {
                    PMA_ajaxRemoveMessage($msgbox);
                    $this
                    .clone()
                    .html(data.error)
                    .dialog({
                        title: $(this).prop("title"),
                        height: 230,
                        width: 900,
                        modal: true,
                        buttons: button_options_error
                    }); // end dialog options
                } else {
                    $('#fieldsForm ul.table-structure-actions').menuResizer('destroy');
                    // sort the fields table
                    var $fields_table = $("table#tablestructure tbody");
                    // remove all existing rows and remember them
                    var $rows = $fields_table.find("tr").remove();
                    // loop through the correct order
                    for (var i in data.columns) {
                        var the_column = data.columns[i];
                        var $the_row = $rows
                            .find("input:checkbox[value=" + the_column + "]")
                            .closest("tr");
                        // append the row for this column to the table
                        $fields_table.append($the_row);
                    }
                    var $firstrow = $fields_table.find("tr").eq(0);
                    // Adjust the row numbers and colors
                    for (var $row = $firstrow; $row.length > 0; $row = $row.next()) {
                        $row
                        .find('td:nth-child(2)')
                        .text($row.index() + 1)
                        .end()
                        .removeClass("odd even")
                        .addClass($row.index() % 2 == 0 ? "odd" : "even");
                    }
                    PMA_ajaxShowMessage(data.message);
                    $this.dialog('close');
                    $('#fieldsForm ul.table-structure-actions').menuResizer(PMA_tbl_structure_menu_resizer_callback);
                }
            });
        };
        button_options[PMA_messages['strCancel']] = function() {
            $(this).dialog('close');
        };

        var button_options_error = {};
        button_options_error[PMA_messages['strOK']] = function() {
            $(this).dialog('close').remove();
        };

        var columns = [];

        $("#tablestructure tbody tr").each(function () {
            var col_name = $(this).find("input:checkbox").eq(0).val();
            var hidden_input = $("<input/>")
                .prop({
                    name: "move_columns[]",
                    type: "hidden"
                })
                .val(col_name);
            columns[columns.length] = $("<li/>")
                .addClass("placeholderDrag")
                .text(col_name)
                .append(hidden_input);
        });

        var col_list = $("#move_columns_dialog ul")
            .find("li").remove().end();
        for(var i in columns) {
            col_list.append(columns[i]);
        }
        col_list.sortable({
            axis: 'y',
            containment: $("#move_columns_dialog div")
        }).disableSelection();
        var $form = $("#move_columns_dialog form");
        $form.data("serialized-unmoved", $form.serialize());

        $("#move_columns_dialog").dialog({
            modal: true,
            buttons: button_options,
            beforeClose: function () {
                $("#move_columns_anchor").removeClass("move-active");
            }
        });
    });
});

/**
 * Reload fields table
 */
function reloadFieldForm(message) {
    $.post($("#fieldsForm").attr('action'), $("#fieldsForm").serialize()+"&ajax_request=true", function(form_data) {
        var $temp_div = $("<div id='temp_div'><div>").append(form_data.message);
        $("#fieldsForm").replaceWith($temp_div.find("#fieldsForm"));
        $("#addColumns").replaceWith($temp_div.find("#addColumns"));
        $('#move_columns_dialog ul').replaceWith($temp_div.find("#move_columns_dialog ul"));
        $("#moveColumns").removeClass("move-active");
        /* reinitialise the more options in table */
        $('#fieldsForm ul.table-structure-actions').menuResizer(PMA_tbl_structure_menu_resizer_callback);
        setTimeout(function() {
            PMA_ajaxShowMessage(message);
        }, 500);
    });
    $('#page_content').show();
}

/**
 * This function returns the horizontal space available for the menu in pixels.
 * To calculate this value we start we the width of the main panel, then we
 * substract the margin of the page content, then we substract any cellspacing
 * that the table may have (original theme only) and finally we substract the
 * width of all columns of the table except for the last one (which is where
 * the menu will go). What we should end up with is the distance between the
 * start of the last column on the table and the edge of the page, again this
 * is the space available for the menu.
 *
 * In the case where the table cell where the menu will be displayed is already
 * off-screen (the table is wider than the page), a negative value will be returned,
 * but this will be treated as a zero by the menuResizer plugin.
 *
 * @return int
 */
function PMA_tbl_structure_menu_resizer_callback() {
    var pagewidth = $('body').width();
    var $page = $('#page_content');
    pagewidth -= $page.outerWidth(true) - $page.outerWidth();
    var columnsWidth = 0;
    var $columns = $('#tablestructure').find('tr:eq(1)').find('td,th');
    $columns.not(':last').each(function (){
        columnsWidth += $(this).outerWidth(true)
    })
    var totalCellSpacing = $('#tablestructure').width();
    $columns.each(function (){
        totalCellSpacing -= $(this).outerWidth(true);
    });
    return pagewidth - columnsWidth - totalCellSpacing - 15; // 15px extra margin
};

/** Handler for "More" dropdown in structure table rows */
AJAX.registerOnload('tbl_structure.js', function() {
    if ($('#fieldsForm').hasClass('HideStructureActions')) {
        $('#fieldsForm ul.table-structure-actions').menuResizer(PMA_tbl_structure_menu_resizer_callback);
    }
});
AJAX.registerTeardown('tbl_structure.js', function() {
    $('#fieldsForm ul.table-structure-actions').menuResizer('destroy');
});
$(function () {
    $(window).resize($.throttle(function () {
        var $list = $('#fieldsForm ul.table-structure-actions');
        if ($list.length) {
            $list.menuResizer('resize');
        }
    }));
});
