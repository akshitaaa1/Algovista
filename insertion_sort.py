def insertion_sort(arr):
    steps = []
    n = len(arr)
    sorted_indices = {0}

    steps.append({
        "array": arr[:],
        "comparing": [],
        "swapping": [],
        "sorted": sorted(sorted_indices),
        "pivot": -1,
        "explanation": f"Starting with first element {arr[0]} — a single element is always sorted."
    })

    for i in range(1, n):
        key = arr[i]
        j = i - 1

        steps.append({
            "array": arr[:],
            "comparing": [i],
            "swapping": [],
            "sorted": sorted(sorted_indices),
            "pivot": -1,
            "explanation": f"Picking element {key} at index {i} to insert into sorted portion."
        })

        while j >= 0 and arr[j] > key:
            steps.append({
                "array": arr[:],
                "comparing": [j, j + 1],
                "swapping": [],
                "sorted": sorted(sorted_indices),
                "pivot": -1,
                "explanation": f"Comparing {arr[j]} > {key} — shifting {arr[j]} right"
            })

            arr[j + 1] = arr[j]

            steps.append({
                "array": arr[:],
                "comparing": [],
                "swapping": [j, j + 1],
                "sorted": sorted(sorted_indices),
                "pivot": -1,
                "explanation": f"Shifted {arr[j+1]} one position right to index {j+1}"
            })

            j -= 1

        arr[j + 1] = key
        sorted_indices.add(i)

        steps.append({
            "array": arr[:],
            "comparing": [],
            "swapping": [],
            "sorted": sorted(sorted_indices),
            "pivot": -1,
            "explanation": f"Inserted {key} at index {j+1}. Sorted portion now has {i+1} elements."
        })

    return steps