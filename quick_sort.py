def quick_sort(arr):
    steps = []
    sorted_indices = set()

    def partition(arr, low, high):
        pivot_val = arr[high]

        steps.append({
            "array": arr[:],
            "comparing": [],
            "swapping": [],
            "sorted": sorted(sorted_indices),
            "pivot": high,
            "explanation": f"Pivot selected: {pivot_val} at index {high}"
        })

        i = low - 1

        for j in range(low, high):
            steps.append({
                "array": arr[:],
                "comparing": [j, high],
                "swapping": [],
                "sorted": sorted(sorted_indices),
                "pivot": high,
                "explanation": f"Comparing {arr[j]} with pivot {pivot_val}"
            })

            if arr[j] <= pivot_val:
                i += 1
                if i != j:
                    arr[i], arr[j] = arr[j], arr[i]
                    steps.append({
                        "array": arr[:],
                        "comparing": [],
                        "swapping": [i, j],
                        "sorted": sorted(sorted_indices),
                        "pivot": high,
                        "explanation": f"Swapping {arr[j]} and {arr[i]} — {arr[i]} ≤ pivot {pivot_val}"
                    })

        # Place pivot in correct position
        arr[i + 1], arr[high] = arr[high], arr[i + 1]
        pivot_pos = i + 1

        steps.append({
            "array": arr[:],
            "comparing": [],
            "swapping": [i + 1, high],
            "sorted": sorted(sorted_indices),
            "pivot": pivot_pos,
            "explanation": f"Placing pivot {pivot_val} into its final position at index {pivot_pos}"
        })

        sorted_indices.add(pivot_pos)
        steps.append({
            "array": arr[:],
            "comparing": [],
            "swapping": [],
            "sorted": sorted(sorted_indices),
            "pivot": -1,
            "explanation": f"Pivot {pivot_val} is now at its final sorted position (index {pivot_pos})."
        })

        return pivot_pos

    def _quick_sort(arr, low, high):
        if low < high:
            pi = partition(arr, low, high)
            _quick_sort(arr, low, pi - 1)
            _quick_sort(arr, pi + 1, high)
        elif low == high:
            sorted_indices.add(low)
            steps.append({
                "array": arr[:],
                "comparing": [],
                "swapping": [],
                "sorted": sorted(sorted_indices),
                "pivot": -1,
                "explanation": f"Single element {arr[low]} at index {low} is trivially sorted."
            })

    _quick_sort(arr, 0, len(arr) - 1)

    # Final step — everything sorted
    steps.append({
        "array": arr[:],
        "comparing": [],
        "swapping": [],
        "sorted": list(range(len(arr))),
        "pivot": -1,
        "explanation": "Array is fully sorted!"
    })

    return steps