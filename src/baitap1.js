function getAverageScore(students)
{
    let sum =0;
    students.forEach(student =>{
        sum+=student.score;
    })
    return sum/students.length;
}

const students = [
    { name: "An", age: 20, score: 8.5 },
    { name: "Bình", age: 21, score: 6.5 },
    { name: "Cường", age: 19, score: 9.2 },
    { name: "Dũng", age: 22, score: 4.8 },
    { name: "Hùng", age: 20, score: 7.0 }
];

function countPassedStudents(students)
{
    let diem = 5;
    let c = [];
    students.forEach(student =>{
        if (student.score >= diem) c.push(student.name);
    })
    return c;
}


// let count = countPassedStudents(students);
// console.log(count);


function findStudentByName(students,name)
{
    let st
    students.forEach(student =>{
        
        if (student.name === name) st = student;
    })
    return st;
}

console.log(findStudentByName(students, "An"))
