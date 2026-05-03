def selection_sort(arr):
    steps = []
    n = len(arr)
    sorted_indices = set()

    for i in range(n):
        min_idx = i

        for j in range(i + 1, n):
            steps.append({
                "array": arr[:],
                "comparing": [min_idx, j],
                "swapping": [],
                "sorted": sorted(sorted_indices),
                "pivot": -1,
                "explanation": f"Comparing {arr[j]} with current minimum {arr[min_idx]}"
            })

            if arr[j] < arr[min_idx]:
                min_idx = j
                steps.append({
                    "array": arr[:],
                    "comparing": [min_idx],
                    "swapping": [],
                    "sorted": sorted(sorted_indices),
                    "pivot": -1,
                    "explanation": f"New minimum found: {arr[min_idx]} at index {min_idx}"
                })

        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]
            steps.append({
                "array": arr[:],
                "comparing": [],
                "swapping": [i, min_idx],
                "sorted": sorted(sorted_indices),
                "pivot": -1,
                "explanation": f"Swapping {arr[min_idx]} and {arr[i]} — placing minimum at index {i}"
            })

        sorted_indices.add(i)
        steps.append({
            "array": arr[:],
            "comparing": [],
            "swapping": [],
            "sorted": sorted(sorted_indices),
            "pivot": -1,
            "explanation": f"Index {i} is sorted: {arr[i]} is in its final position."
        })

    return steps