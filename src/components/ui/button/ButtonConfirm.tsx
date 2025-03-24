import React from 'react'

export const ButtonConfirm = () => {
  return (
    <div className='w-full flex justify-end items-center'>
			<button 
				type="submit"
				className='rounded-lg transition-colors duration-150 bg-prinFuchsia hover:bg-btnFuchsiaHov'
			>
				<p className='text-txtWhite font-semibold px-6 py-2'>
					Confirmar
				</p>
			</button>
		</div>
  )
}
