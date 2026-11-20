function secondLargest(numbers: number[]): number | null {
    let largest = -Infinity;
    let secondLargest = -Infinity;

    for (let i = 0; i < numbers.length; i++) {
        const current = numbers[i];

        if (current > largest) {
            secondLargest = largest;
            largest = current;
        } else if (current < largest && current > secondLargest) {
            secondLargest = current;
        }
    }

    if (secondLargest === -Infinity) {
        return null;
    }

    return secondLargest;
}

console.log(secondLargest([12, 45, 7, 89, 34, 89, 23, 67]));
// 67

console.log(secondLargest([5, 5, 5]));
// null

console.log(secondLargest([-10, -3, -20]));
// -10