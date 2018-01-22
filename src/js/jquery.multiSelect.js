/* v1.1
 * 添加onPickingId 添加商品是可根据回调函数筛选商品
 * v1.2
 * 添加 paginationRequest  异步加载功能*/
var MultiSelect = function(options) {
	var self = {};

	var defaults = {
		// 标题
		title : "",
		// 后台请求路径
		url : null,
		//条目名称
		itemName:"",
		// ajax请求类型
		requestMethod : "get",
		// ajax请求参数
		requestParams : {},
		// 列表中的行
		tabRows : {},
		// 额外的搜索条件
		extendSearchParams : "",
		beforeCreateFunction : null,
		// 传入页面中以选择的商品
		pickedIds : null,
		// 添加的时候 筛选可添加的元素
		onPickingId : null,
		// onDialogConfirm关闭dialog时输出ids
		onDialogConfirm : null,
		extendActionContainer : null,
		extendBindEvent : null,
		// 弹窗大小
		dialogWidth : 1035,
		beforeSearchRequest : null,
		paginationRequest : false,
		//统一处理ajax后台未返回参数的情况。
		ajaxEmptyCallback : null
	};

	// 整合初始参数和传入参数
	options = $.extend(defaults, options);
	self.pickedList = {};
	self.totalList = {};
	self.$dialog = null;
	self.timer = null;
	var requestLock = false;
	self.Pagination = function() {
		var defaultPageNumber = 1;
		var pageNumber = defaultPageNumber;
		var otherParams = {};
		return {
			getPageNumber : function() {
				return pageNumber;
			},
			increasePageNumber : function() {
				pageNumber++;
				return pageNumber;
			},
			resetPageNumber : function() {
				pageNumber = defaultPageNumber;
				return pageNumber;
			},
			lastRequestOtherParams : function(params) {
				if (!!params) {
					otherParams = params;
				}
				return otherParams;
			}
		}
	};

	// 过滤已经放入pickedList的数据
	self.fitlerTotalList = function() {
		$.each(self.pickedList, function(i, item) {
			if (!!self.totalList[i]) {
				delete self.totalList[i];
			}
		});
	};

	self.getSize = function() {
		return Object.keys(this).length;
	};
	// 搜索栏模块
	self.SearchGroup = function($parent) {
		// SearchGroup初始化
		var html = '<div class="searchGroup">';
		if (!!options.extendSearchParams) {
			html += options.extendSearchParams;
		} else {
			html += '<input type="text" class="text searchParams" name="keyword" id="keyword" placeholder="请输入编号或名称搜索" style="width:175px;"/>'
		}
		html += '<input type="button" class="searchButton" value=""/>'
				+ '</div>';
		// 创建搜索框,selectGroup方便后期需要重新渲染搜索条件时使用
		var $searchGroup = $(html);
		$parent.append($searchGroup);

		// SearchGroup的方法
		// 根据页面上的select框和input的模糊搜索框来添加data数据
		$searchGroup.getSearchParams = function() {
			var data = {};
			if ($(this).find(".searchParams").length > 0) {
				$.each($(this).find(".searchParams"), function(i, element) {
					var name = $(element).attr("name");
					var value = $(element).val();
					data[name] = value;
				});
			}
			return data;
		};
		// 动态替换搜索条件
		$searchGroup.replaceSelectGroup = function() {
			$(this).find(".selectGroup").empty.html(options.extendSearchParams);
		};
		var bindEvent = function() {

			$searchGroup.on("click", ".searchButton", function() {
				if (typeof options.beforeSearchRequest === "function") {
					options.beforeSearchRequest();
				}
				self.requestInterface();
			});
		}();
		return $searchGroup;
	};
	self.requestInterface = function(otherParams) {
		/* var otherParams ={}; */
		if (!!options.paginationRequest) {
			otherParams["pageNumber"] = self.pagination.resetPageNumber();
		}
		self.ajaxRequest(function(data) {
			self.totalList = {};
			$.each(data, function(i, item) {
				self.totalList[item.id] = item;
			})
			self.fitlerTotalList();
			self.$totalContainer.replaceList();
		}, otherParams);
	};
	self.appendContent = function(list) {
		var tBodyHtml = '';
		$.each(list, function(i, item) {
			tBodyHtml += '<tr class="' + item["id"] + '" data="' + item["id"]
					+ '">';
			$.each(options.tabRows, function(i, name) {
				if (!!item[i]) {
					tBodyHtml += '<td' + ' class="' + i + '" title="' + item[i]
							+ '">' + item[i] + '</td>';
				} else {
					tBodyHtml += '<td>' + '空' + '</td>';
				}
			});
			tBodyHtml += '</tr>';
		});
		return tBodyHtml;
	};
	// 传入ids,将全部列表中ids对应的对象存到已选列表
	// params ids : 需要移动的元素id,不传时移动整个源list的元素
	// sourceList : 源list
	// sourceContainer : 源容器
	// targetList : 目标list
	// targetContainer : 目标容器
	self.moveToTargetList = function(handleData) {
		var callback = function(ids) {
			$.each(ids, function(i, id) {
				if (!!handleData.sourceList[id]) {
					handleData.targetList[id] = handleData.sourceList[id];
					delete handleData.sourceList[id];
					handleData.sourceContainer.find("tr." + id).removeClass(
							"checked").appendTo(handleData.targetContainer);
				}
			});

			$(".totalQuantity").html(self.getSize.call(self.totalList) + "个");
			$(".pickedQuantity").html(self.getSize.call(self.pickedList) + "个");
		}

		if (!handleData.ids) {
			handleData.ids = Object.keys(handleData.sourceList);
		}
		if (typeof options.onPickingId == "function") {
			options.onPickingId(handleData, self, callback);
		} else {
			callback(handleData.ids);
		}

	};
	// 全部数据模块
	self.TotalContainer = function($parent) {

		var $totalContainer = $('<div class="totalContainer"></div>');

		// 新增数据，传入需要新增的数据
		$totalContainer.appendList = function(list) {
			$totalContainer.$body.append(self.appendContent(list));
			$(".totalQuantity").html(self.getSize.call(self.totalList) + "个");
		};
		// 替换数据，先清空，再插入整个totalList
		$totalContainer.replaceList = function() {
			$totalContainer.$body.empty().append(
					self.appendContent(self.totalList));
			$(".totalQuantity").html(self.getSize.call(self.totalList) + "个");
		};
		// 清空数据
		$totalContainer.clearList = function() {
			$totalContainer.$body.empty();
			$(".totalQuantity").html(self.getSize.call(self.totalList) + "个");
		};
		var bindEvent = function() {
			$totalContainer.on("click", "tr", function(e) {
				var $this = $(this);
				if ($this.parent().is("thead")) {
					return;
				}
				clearTimeout(self.timer);
				self.timer = setTimeout(function() {

					if ($this.hasClass("checked")) {
						$this.removeClass("checked");
					} else {
						$this.addClass("checked");
					}
				}, 200);
			});
			$totalContainer.on("dblclick", "tr", function(item) {
				var $this = $(this);
				if ($this.parent().is("thead")) {
					return;
				}
				clearTimeout(self.timer);
				var id = $(this).attr("data");
				self.moveToTargetList({
					ids : [ id ],
					sourceList : self.totalList,
					sourceContainer : self.$totalContainer.$body,
					targetList : self.pickedList,
					targetContainer : self.$pickedContainer.$body
				});
			});
			if (!!options.paginationRequest) {
				$totalContainer.on("scroll", function(item) {
					if (!!requestLock) {
						var totalContainerHeight = $totalContainer.height();
						var scrollTop = $totalContainer.scrollTop();
						var totalTableHeight = $totalContainer.find(
								".totalTable").height();
						var surplusHeight = totalTableHeight - scrollTop
								- totalContainerHeight;
						if (50 > surplusHeight) {
							var otherParams = self.pagination
									.lastRequestOtherParams();
							otherParams["pageNumber"] = self.pagination
									.increasePageNumber();
							console.log(otherParams["pageNumber"]);
							// 发送ajax请求数据，返回全部列表
							self.ajaxRequest(function(data) {
								self.totalList = {};
								$.each(data, function(i, item) {
									self.totalList[item.id] = item;
								})
								self.fitlerTotalList();
								self.$totalContainer.appendList(data);
							}, otherParams);
						}
					}
				});
			}
		};
		// 初始化方法
		$totalContainer.init = function() {
			var html = '<div>可选'+options.itemName+'列表：<span class="totalQuantity"></span></div>'
					+ '<table class="totalTable"><thead><tr>';
			$.each(options.tabRows, function(i, name) {
				html += '<th class="' + i + '">' + name + '</th>'
			});
			html += '</tr></thead><tbody></tbody></table>';

			$totalContainer.append(html).appendTo($parent);
			$totalContainer.$body = $totalContainer.find("tbody");
			bindEvent();
		}();
		return $totalContainer;
	};
	// 已选数据模块
	self.PickedContainer = function($parent) {
		var $pickedContainer = $('<div class="pickedContainer"></div>');

		// 新增数据，传入需要新增的数据
		$pickedContainer.appendList = function(list) {
			$pickedContainer.$body.append(self.appendContent(list));
			$(".pickedQuantity").html(self.getSize.call(self.pickedList) + "个");
			return this;
		};
		// 替换数据，先清空，再插入整个totalList
		$pickedContainer.replaceList = function() {
			$pickedContainer.$body.empty().append(
					self.appendContent(self.pickedList));
			$(".pickedQuantity").html(self.getSize.call(self.pickedList) + "个");
			return this;
		};
		// 清空数据
		$pickedContainer.clearList = function() {
			$pickedContainer.$body.empty();
			$(".pickedQuantity").html(self.getSize.call(self.pickedList) + "个");
			return this;
		};
		var bindEvent = function() {
			$pickedContainer.on("click", "tr", function(item) {
				var $this = $(this);
				if ($this.parent().is("thead")) {
					return;
				}
				clearTimeout(self.timer);
				self.timer = setTimeout(function() {
					if ($this.hasClass("checked")) {
						$this.removeClass("checked");
					} else {
						$this.addClass("checked");
					}
				}, 200);
			});
			$pickedContainer.on("dblclick", "tr", function(item) {
				var $this = $(this);
				if ($this.parent().is("thead")) {
					return;
				}
				clearTimeout(self.timer);
				var id = $(this).attr("data");
				self.moveToTargetList({
					ids : [ id ],
					sourceList : self.pickedList,
					sourceContainer : self.$pickedContainer.$body,
					targetList : self.totalList,
					targetContainer : self.$totalContainer.$body
				});
			});
		};
		// 初始化方法
		$pickedContainer.init = function() {
			var html = '<div>已选'+options.itemName+'列表：<span class="pickedQuantity"></span></div>'
					+ '<table class="pickedTable"><thead><tr>';
			$.each(options.tabRows, function(i, name) {
				html += '<th class="' + i + '">' + name + '</th>'
			});
			html += '</tr></thead><tbody></tbody></table>';
			$pickedContainer.append(html).appendTo($parent);
			$pickedContainer.$body = $pickedContainer.find("tbody");
			bindEvent();
		}();
		return $pickedContainer;
	};

	self.getIds = function($selectors) {
		var ids = [];
		$.each($selectors, function(i, item) {
			var id = $(item).attr("data");
			ids.push(id);
		});
		return ids;
	};
	self.getEditPickIds = function() {
		if (typeof options.pickedIds === "function") {
			options.pickedIds = options.pickedIds();
		} else if (typeof options.pickedIds === "string") {
			options.pickedIds = options.pickedIds.split(",");
		}

	};
	self.moveEditPickIds = function() {
		if (!!options.pickedIds && options.pickedIds.length > 0) {
			self.moveToTargetList({
				ids : options.pickedIds,
				sourceList : self.totalList,
				sourceContainer : self.$totalContainer.$body,
				targetList : self.pickedList,
				targetContainer : self.$pickedContainer.$body
			});
		}
	};
	// 操作栏
	self.HandleContainer = function($parent) {
		var $handleContainer = $('<div class="handleContainer"></div>');
		var bindEvent = function() {
			$handleContainer.on("click", ".append", function(item) {
				var ids = self.getIds(self.$totalContainer.find("tr.checked"));
				self.moveToTargetList({
					ids : ids,
					sourceList : self.totalList,
					sourceContainer : self.$totalContainer.$body,
					targetList : self.pickedList,
					targetContainer : self.$pickedContainer.$body
				});
			});
			$handleContainer.on("click", ".appendAll", function(item) {
				self.moveToTargetList({
					sourceList : self.totalList,
					sourceContainer : self.$totalContainer.$body,
					targetList : self.pickedList,
					targetContainer : self.$pickedContainer.$body
				});
			});
			$handleContainer.on("click", ".remove", function(item) {
				var ids = self.getIds(self.$pickedContainer
						.find("tr.checked"));
				self.moveToTargetList({
					ids : ids,
					sourceList : self.pickedList,
					sourceContainer : self.$pickedContainer.$body,
					targetList : self.totalList,
					targetContainer : self.$totalContainer.$body
				});
			});
			$handleContainer.on("click", ".removeAll", function(item) {
				self.moveToTargetList({
					sourceList : self.pickedList,
					sourceContainer : self.$pickedContainer.$body,
					targetList : self.totalList,
					targetContainer : self.$totalContainer.$body
				});
			});
		}
		// 初始化方法
		$handleContainer.init = function() {
			var html = '<div><button class="append button">添加</button></div>'
					+ '<div><button class="appendAll button">全部添加</button></div>'
					+ '<div><button class="remove button">删除</button></div>'
					+ '<div><button class="removeAll button">全部删除</button></div>';

			$handleContainer.append(html).appendTo($parent);
			bindEvent();
		}();
		return $handleContainer;
	};
	// 弹窗中额外的元素
	self.ExtendActionContainer = function($parent) {
		var $extendActionContainer = $('<div class="extendActionContainer"></div>');
		$extendActionContainer.init = function() {
			$extendActionContainer.append(options.extendActionContainer)
					.appendTo($parent);
		}();
		return $extendActionContainer;
	};
	self.destroy = function() {
		// to do 销毁
		// 解除按钮绑定
		$("body").off("click", ".handleContainer .append");
		$("body").off("click", ".handleContainer .appendAll");
		$("body").off("click", ".handleContainer .remove");
		$("body").off("click", ".handleContainer .removeAll");
		$("body").off("click", ".searchGroup .searchButton");
		$("body").off("click", ".totalContainer tr");
		$("body").off("dblclick", ".totalContainer tr");
		$("body").off("click", ".pickedContainer tr");
		$("body").off("dblclick", ".pickedContainer tr");
	};
	// ajax请求
	self.ajaxRequest = function(callback, otherParams) {
		var requestData = self.$searchGroup.getSearchParams();
		$.each(options.requestParams, function(i, item) {
			if (typeof item === "function") {
				requestData[i] = item();
			} else {
				requestData[i] = item;
			}
		});
		if (!!options.paginationRequest) {
			self.pagination.lastRequestOtherParams(otherParams);
		}
		if (!!otherParams) {
			$.each(otherParams, function(i, item) {
				if (typeof item === "function") {
					requestData[i] = item();
				} else {
					requestData[i] = item;
				}
			});
		}

		$.ajax({
			url : options.url,
			type : options.requestMethod,
			dataType : "json",
			data : requestData,
			beforeRequest : function() {
				requestLock = true;
			},
			success : function(data) {
				if (!data || data.length == 0) {
					if(options.ajaxEmptyCallback && (typeof options.ajaxEmptyCallback == "function")){
						options.ajaxEmptyCallback(self.$dialog);
					}else{
						console.warn("后台未返回数据");						
					}
				}
				// to do
				callback(data);
			},
			complete : function() {
				requestLock = false;
			}
		});
	},
	// 传入ids,
	self.bindEvent = function() {
		// todo 如果multiSelect需要绑定事件
		if (typeof options.extendBindEvent === "function") {
			options.extendBindEvent();
		}
	};
	// 初始化方法
	self.init = function() {
		// 生成对象前的判断
		if (typeof options.beforeCreateFunction === "function") {
			if (!options.beforeCreateFunction()) {
				return false;
			}
		}
		// 生成模态框
		self.$dialog = $.dialog({
			title : options.title,
			content : '<div class="multiSelect"></div>',
			width : options.dialogWidth,
			maxHeight : 800,
			modal : true,
			onShow : function($dialog) {
				var $multiSelect = $(".multiSelect");
				// 生成 搜索框对象
				self.$searchGroup = self.SearchGroup($multiSelect);
				if (options.extendActionContainer) {
					self.$extendActionContainer = self
							.ExtendActionContainer($multiSelect);
				}
				// 生成全部列表
				self.$totalContainer = self
						.TotalContainer($multiSelect);
				// 生成操作栏
				self.HandleContainer($multiSelect);
				// 生成已选列表
				self.$pickedContainer = self
						.PickedContainer($multiSelect);
				self.getEditPickIds();
				var otherParams = {};
				if (!!options.paginationRequest) {

					self.pagination = self.Pagination();
					otherParams["pageNumber"] = self.pagination
							.getPageNumber();
					// 如果要分页，可能已经选择的商品不在首次刷出商品列表里，传pickedIds,让后台将已经选择的商品加到分页里
					otherParams["pickedIds"] = options.pickedIds;
				}

				// 发送ajax请求数据，返回全部列表
				self.ajaxRequest(function(data) {
					self.totalList = {};
					$.each(data, function(i, item) {
						self.totalList[item.id] = item;
					})
					self.fitlerTotalList();
					self.$totalContainer.replaceList();
					self.$pickedContainer.replaceList();
					self.moveEditPickIds();
					self.bindEvent();
				}, otherParams);

			},
			onOk : function() {
				var ids = [];
				$.each(self.pickedList, function(index, item) {
					ids.push(index);
				});
				if (typeof options.onDialogConfirm === "function") {
					options.onDialogConfirm(ids, self.pickedList);
				}
				;
				self.destroy();
			},
			onCancel : function() {
				self.destroy();
			},
			onClose : function() {
				self.destroy();
			},
		});
		return true;
	};
	if (!self.init()) {
		return false;
	}
	return {
		$dialog : self.$dialog,
		distory : self.destroy,
		requestInterface : self.requestInterface
	}
};
