/*
* @Author: KennyLiang
* @Date:   2018-03-16 14:37:00
* @Last Modified time: 2018-03-16 14:44:19
*/
//默认允许上传最大文件大小 50m 
let maxSize = 50 * 1024 * 1024;

function buildFormData(task) {
	let formData = new FormData();
	for(let key in formData) {
		if(task.hasOwnProperty(key)) {
			formData.append(key,task[key])
		}
	}
	return formData
}
/*
 *上传器，绑定一个XMLHttpRequest对象
*/
function send(params) {
	let task = params.task;
	let url = params.url;
	task.sendTime++;
	let success = params.success || noop;
	let progress = params.progress || noop;
	let error = function(msg) {
		(params.error || noop)(msg)
	}
	let formData = buildFormData(task);
	let xhr = new XMLHttpRequest();

	xhr.open("POST",url)
	xhr.addEventListener("load", function() {
		if(xhr.status == 200) {		//上传成功
			try{
				let json = JSON.parse(xhr.responseText);
				if(json.ret !== 0) {
					console.error(json.msg);
					alert(json.msg);
					error('upload error')
				}else {
					success(json.data)
				}
			}catch(e) {
				console.error('response error',e);
				error('upload error')
			}
		}else {
			console.error('上传失败',xhr);
			error('upload error')
		}
	});
	xhr.onerror = function() {	//处理上传错误
		console.error('xhr 出错了',arguments);
		error('upload error')
	};
	xhr.upload.onprogress = function() {	//上传进度
		let percentComplete = Math.floor(((e.loaded / e.total) || 0)) * 10000) / 100;
		progress(percentComplete);
		console.log(percentComplete)
	}
	xhr.send(formData)
};

function noop() {};

function Upload(params) {
	let file = params.file;
	let progress = params.progress || noop;
	let success = params.success || noop;
	let error = params.error || noop;
	let extraData = params.extraData || {};
	let url = params.url;
	maxSize = params.maxSize || maxSize;
	if(!file) {
		error('文件为空');
		return
	}
	if(file.size > maxSize) {
		error('最大'+maxSize+',文件'+file.size);
		return
	}
	//避免文件的重名导致服务端无法定位文件，需要给每个文件生产一个UUID
	let uuid = [file.name,file.size,file.lastModified,+new Date()].join('_');
	let task = {
		data: file,
		uuid: uuid
	}
	if(extraData) {
		for(let key in extraData) {
			if(extraData.hasOwnProperty(key)) {
				task[key] = extraData[key]
			}
		}
	}
	send({
		url: url,
		task: task,
		success: function(data) {
			if(data.url) {
				progress(100);
				success({
					url: data.url
				})
			}
		},
		progress: progress,
        error: error
	})
}