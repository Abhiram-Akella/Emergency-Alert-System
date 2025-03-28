const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    
    return (
      <div className="flex items-center justify-center space-x-2 mt-4">
        <button
          className="btn btn-outline btn-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        
        {pages.map(page => (
          <button
            key={page}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === page
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        
        <button
          className="btn btn-outline btn-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    )
  }
  
  export default Pagination