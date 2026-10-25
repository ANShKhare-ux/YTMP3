function approachOld(list, newJob) {
  return [newJob, ...list.filter(item => item.id !== newJob.id)].slice(0, 50);
}

function approachNew(list, newJob) {
  const existingIndex = list.findIndex(item => item.id === newJob.id);
  if (existingIndex !== -1) {
    list.splice(existingIndex, 1);
  }
  list.unshift(newJob);
  if (list.length > 50) {
    list.length = 50;
  }
  return list;
}

const ITERATIONS = 500000;

let oldList = [];
console.time('Old Approach');
for (let i = 0; i < ITERATIONS; i++) {
  oldList = approachOld(oldList, { id: i % 60, val: i }); // Mod 60 to ensure we get some > 50 growth and shifting
}
console.timeEnd('Old Approach');

let newList = [];
console.time('New Approach');
for (let i = 0; i < ITERATIONS; i++) {
  approachNew(newList, { id: i % 60, val: i });
}
console.timeEnd('New Approach');
