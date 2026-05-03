def bubble_sort_steps(arr):
    steps = []
    n = len(arr)
    sorted_indices = set()

    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            # Comparing step
            steps.append({
                "array": arr[:],
                "comparing": [j, j + 1],
                "swapping": [],
                "sorted": sorted(sorted_indices),
                "pivot": -1,
                "explanation": f"Comparing {arr[j]} and {arr[j+1]}"
            })

            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True

                # Swapping step — array already swapped, highlight the two positions
                steps.append({
                    "array": arr[:],
                    "comparing": [],
                    "swapping": [j, j + 1],
                    "sorted": sorted(sorted_indices),
                    "pivot": -1,
                    "explanation": f"Swapping {arr[j+1]} and {arr[j]} (were out of order)"
                })

        # Mark the last unsorted element as sorted
        sorted_indices.add(n - 1 - i)
        steps.append({
            "array": arr[:],
            "comparing": [],
            "swapping": [],
            "sorted": sorted(sorted_indices),
            "pivot": -1,
            "explanation": f"Element {arr[n-1-i]} is now in its final sorted position."
        })

        if not swapped:
            # Array already sorted — mark all remaining
            for k in range(n):
                sorted_indices.add(k)
            steps.append({
                "array": arr[:],
                "comparing": [],
                "swapping": [],
                "sorted": sorted(sorted_indices),
                "pivot": -1,
                "explanation": "No swaps in this pass — array is fully sorted!"
            })
            break

    return steps