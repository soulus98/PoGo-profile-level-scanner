function dateToTime(inDate){
	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep','Oct', 'Nov', 'Dec'];
	var time = `${inDate.getFullYear()}-${months[inDate.getMonth()]}-${(inDate.getDate()<10)?`0${inDate.getDate()}`:inDate.getDate()} ${inDate.getHours()}:${(inDate.getMinutes()<10)?`0${inDate.getMinutes()}`:inDate.getMinutes()}:${(inDate.getSeconds()<10)?`0${inDate.getSeconds()}`:inDate.getSeconds()}`;
	return time;
}
module.exports = {dateToTime};
